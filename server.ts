import pg from 'pg';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * [CORE_TECH] DATABASE PERSISTENCE
 * Logic: Strict PostgreSQL-Only Mode.
 * Philosophy: Simple, Resource-efficient, High Stability, and Local.
 */
const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mail_agenda',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const app = express();
const PORT = 3000;

// Body limit for PDF uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Ensure Directory Structure
const dirs = [
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'data', 'uploads'),
  path.join(process.cwd(), 'data', 'backups'),
  path.join(process.cwd(), 'data', 'logs'),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * [LOGIC_HOTSPOTS] LOGGING SYSTEM
 */
function logMessage(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logLine.trim());
  try {
    const logDir = path.join(process.cwd(), 'data', 'logs');
    const logFile = path.join(logDir, 'app.log');
    fs.appendFileSync(logFile, logLine);
    
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > 5 * 1024 * 1024) {
        for (let i = 2; i >= 1; i--) {
          const oldFile = path.join(logDir, `app.${i}.log`);
          const nextFile = path.join(logDir, `app.${i + 1}.log`);
          if (fs.existsSync(oldFile)) fs.renameSync(oldFile, nextFile);
        }
        fs.renameSync(logFile, path.join(logDir, 'app.1.log'));
      }
    }
  } catch (err) {}
}

const defaultDbConfig = {
  appName: 'Agenda Persuratan Kantor',
  themeColor: '#2563eb',
  autoCompressPdf: true,
  pdfCompressionLevel: 'medium',
  maxUploadSizeMb: 50,
  backupRetentionDays: 7,
  autoRenamePdf: true,
  pdfRenameCols: ['tanggalTerima', 'noSurat', 'suratDari'],
  columns: [
    { key: 'noUrut', label: 'NOMOR', type: 'text', required: true, order: 1 },
    { key: 'tanggalTerima', label: 'TANGGAL TERIMA', type: 'date', required: true, order: 2 },
    { key: 'tanggalSurat', label: 'TANGGAL SURAT', type: 'date', required: true, order: 3 },
    { key: 'jenisSurat', label: 'JENIS SURAT', type: 'text', required: true, order: 4 },
    { key: 'noSurat', label: 'NOMOR SURAT', type: 'text', required: true, order: 5 },
    { key: 'penomoran', label: 'PENOMORAN', type: 'text', required: false, order: 6 },
    { key: 'suratDari', label: 'SURAT DARI', type: 'text', required: true, order: 7 },
    { key: 'perihal', label: 'PERIHAL', type: 'text', required: true, order: 8 },
    { key: 'disposisi', label: 'DISPOSISI', type: 'text', required: false, order: 9 },
    { key: 'catatan', label: 'CATATAN', type: 'text', required: false, order: 10 }
  ]
};

/**
 * [ARCH_BLUEPRINT] DATA ACCESS LAYER
 */
async function readDb() {
  const client = await pool.connect();
  try {
    const configRes = await client.query('SELECT data FROM config LIMIT 1');
    const usersRes = await client.query('SELECT username, password, name, role FROM users');
    const mailsRes = await client.query('SELECT id, metadata, pdf_path as "pdfPath", created_at as "createdAt", updated_at as "updatedAt", version_id as "versionId" FROM mails');
    return {
      config: configRes.rows[0]?.data || defaultDbConfig,
      users: usersRes.rows,
      mails: mailsRes.rows.map(m => {
        const metadata = m.metadata || {};
        return {
          ...m,
          type: metadata.type || 'Masuk',
          metadata
        };
      })
    };
  } finally {
    client.release();
  }
}

// Sidecar Meta for Redundancy
function saveSidecarMeta(mail: any) {
  if (!mail || !mail.pdfPath) return;
  try {
    const fullPath = path.join(process.cwd(), mail.pdfPath);
    const metaPath = fullPath + '.json';
    const metaDir = path.dirname(metaPath);
    if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(metaPath, JSON.stringify(mail, null, 2), 'utf-8');
  } catch (err) {}
}

function deleteSidecarMeta(pdfPath: string) {
  if (!pdfPath) return;
  try {
    const metaPath = path.join(process.cwd(), pdfPath) + '.json';
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch (err) {}
}

function renameSidecarMeta(oldPdfPath: string, newPdfPath: string) {
  if (!oldPdfPath || !newPdfPath || oldPdfPath === newPdfPath) return;
  try {
    const oldMetaPath = path.join(process.cwd(), oldPdfPath) + '.json';
    const newMetaPath = path.join(process.cwd(), newPdfPath) + '.json';
    if (fs.existsSync(oldMetaPath)) {
      const newMetaDir = path.dirname(newMetaPath);
      if (!fs.existsSync(newMetaDir)) fs.mkdirSync(newMetaDir, { recursive: true });
      fs.renameSync(oldMetaPath, newMetaPath);
    }
  } catch (err) {}
}

/**
 * [LOGIC_HOTSPOTS] PDF NAME FORMATTING
 */
function getFormattedPdfName(config: any, metadata: any, originalName: string) {
  const autoRename = config.autoRenamePdf !== false;
  let pdfRenameCols = config.pdfRenameCols || ['tanggalTerima', 'noSurat', 'suratDari'];

  if (autoRename && pdfRenameCols.length > 0) {
    const nameParts: string[] = [];
    pdfRenameCols.forEach((colKey: string) => {
      let val = metadata[colKey];
      if (val === undefined || val === null || String(val).trim() === '') {
        const foundKey = Object.keys(metadata).find(k => k.toLowerCase() === colKey.toLowerCase());
        if (foundKey) val = metadata[foundKey];
      }
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        nameParts.push(String(val).replace(/[^a-zA-Z0-9-_]/g, '_'));
      }
    });
    if (nameParts.length > 0) return nameParts.join('-') + '.pdf';
  }

  if (originalName) {
    const baseName = path.basename(originalName, path.extname(originalName));
    return `${baseName.replace(/[^a-zA-Z0-9-_]/g, '_') || 'dokumen'}.pdf`;
  }
  return `dokumen_${Date.now()}.pdf`;
}

async function renameMailPdfFile(config: any, mail: any) {
  if (!mail.pdfPath || config.autoRenamePdf === false) return mail.pdfPath;
  try {
    const oldRelativePath = mail.pdfPath;
    const oldFullPath = path.join(process.cwd(), oldRelativePath);
    if (!fs.existsSync(oldFullPath)) return mail.pdfPath;

    const formattedName = getFormattedPdfName(config, mail.metadata, path.basename(oldRelativePath));
    const tTerima = mail.metadata.tanggalTerima || new Date().toISOString().split('T')[0];
    const [year, month, day] = tTerima.split('-');
    const relativeUploadDir = path.join('data', 'uploads', year, month, day).replace(/\\/g, '/');
    const uploadDir = path.join(process.cwd(), relativeUploadDir);

    const newRelativePath = path.join(relativeUploadDir, formattedName).replace(/\\/g, '/');
    if (oldRelativePath !== newRelativePath) {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.renameSync(oldFullPath, path.join(uploadDir, formattedName));
      renameSidecarMeta(oldRelativePath, newRelativePath);
      return newRelativePath;
    }
  } catch (err) {}
  return mail.pdfPath;
}

function addDirectoryToZip(zip: JSZip, localDirPath: string, zipPathPrefix: string = '') {
  if (!fs.existsSync(localDirPath)) return;
  const items = fs.readdirSync(localDirPath);
  for (const item of items) {
    const fullLocalPath = path.join(localDirPath, item);
    const relativeZipPath = zipPathPrefix ? `${zipPathPrefix}/${item}` : item;
    const stats = fs.statSync(fullLocalPath);
    if (stats.isDirectory()) {
      addDirectoryToZip(zip, fullLocalPath, relativeZipPath);
    } else if (stats.isFile()) {
      zip.file(relativeZipPath, fs.readFileSync(fullLocalPath));
    }
  }
}

// ==========================================
// REAL-TIME SSE ENGINE
// ==========================================
interface ActiveSession { username: string; name: string; role: string; lastActive: number; }
let activeSessions: Record<string, ActiveSession> = {};
let sseClients: any[] = [];

function broadcastOnlineUsers() {
  const now = Date.now();
  Object.keys(activeSessions).forEach(u => { if (now - activeSessions[u].lastActive > 30000) delete activeSessions[u]; });
  const list = Object.values(activeSessions);
  const data = JSON.stringify({ onlineCount: list.length, users: list });
  sseClients.forEach(c => c.write(`data: ${data}\n\n`));
}
setInterval(broadcastOnlineUsers, 5000);

app.use((req, res, next) => {
  const { 'x-username': u, 'x-user-name': n, 'x-user-role': r } = req.headers as any;
  if (u && n && r) activeSessions[u] = { username: u, name: n, role: r, lastActive: Date.now() };
  next();
});

app.get('/api/sse/online', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  sseClients.push(res);
  broadcastOnlineUsers();
  req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Info
app.get('/api/info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ips: string[] = ['localhost', '127.0.0.1'];
  for (const interfaceName of Object.keys(networkInterfaces)) {
    const list = networkInterfaces[interfaceName];
    if (list) {
      for (const info of list) {
        if (info.family === 'IPv4' && !info.internal) ips.push(info.address);
      }
    }
  }
  res.json({ ips, port: PORT });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT username, name, role FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
    else res.status(401).json({ success: false, message: 'Login gagal' });
  } catch (err) { res.status(500).json({ message: 'DB error' }); }
});

app.post('/api/auth/logout', (req, res) => {
  const { username } = req.body;
  if (username) delete activeSessions[username];
  broadcastOnlineUsers();
  res.json({ success: true });
});

// User Management
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, name, role FROM users');
    res.json(result.rows);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/users', async (req, res) => {
  const { username, name, role, password } = req.body;
  try {
    await pool.query('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)', [username, password, name, role]);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') res.status(400).json({ message: 'Username sudah ada' });
    else res.status(500).send();
  }
});

app.put('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  const { name, role, password } = req.body;
  try {
    if (password) await pool.query('UPDATE users SET name = $1, role = $2, password = $3 WHERE username = $4', [name, role, password, username]);
    else await pool.query('UPDATE users SET name = $1, role = $2 WHERE username = $3', [name, role, username]);
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.delete('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(400).send();
  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

// Config
app.get('/api/config', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.config);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    await pool.query('UPDATE config SET data = $1', [newConfig]);
    if (newConfig.autoRenamePdf !== false) {
      const mailsRes = await pool.query('SELECT * FROM mails');
      for (const m of mailsRes.rows) {
        if (m.pdf_path) {
          const newPath = await renameMailPdfFile(newConfig, { ...m, pdfPath: m.pdf_path, metadata: m.metadata || {} });
          if (newPath !== m.pdf_path) await pool.query('UPDATE mails SET pdf_path = $1 WHERE id = $2', [newPath, m.id]);
        }
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.post('/api/config/columns/reorder', async (req, res) => {
  const { columns } = req.body;
  try {
    const configRes = await pool.query('SELECT data FROM config LIMIT 1');
    if (configRes.rows.length > 0) {
      const configData = configRes.rows[0].data;
      configData.columns = columns;
      await pool.query('UPDATE config SET data = $1', [configData]);
      logMessage('INFO', 'Columns reordered successfully');
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Config not found' });
    }
  } catch (err) {
    res.status(500).send();
  }
});

// Mail Records
app.get('/api/mails', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.mails);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/mails', async (req, res) => {
  const { metadata, pdfData, pdfName } = req.body;
  try {
    const db = await readDb();
    let pdfPath = '';
    if (pdfData && pdfName) {
      const buffer = Buffer.from(pdfData, 'base64');
      const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
      const [year, month, day] = tTerima.split('-');
      const relDir = path.join('data', 'uploads', year, month, day).replace(/\\/g, '/');
      const absDir = path.join(process.cwd(), relDir);
      if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
      const formatted = getFormattedPdfName(db.config, metadata, pdfName);
      fs.writeFileSync(path.join(absDir, formatted), buffer);
      pdfPath = path.join(relDir, formatted).replace(/\\/g, '/');
    }
    const id = `mail_${Date.now()}`;
    const metadataWithType = { ...metadata, type: req.body.type || 'Masuk' };
    await pool.query('INSERT INTO mails (id, metadata, pdf_path, version_id) VALUES ($1, $2, $3, $4)', [id, metadataWithType, pdfPath, 1]);
    saveSidecarMeta({ id, metadata: metadataWithType, pdfPath, createdAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.put('/api/mails/:id', async (req, res) => {
  const { id } = req.params;
  const { metadata, pdfData, pdfName, versionId, deletePdf } = req.body;
  try {
    const db = await readDb();
    const mailRes = await pool.query('SELECT * FROM mails WHERE id = $1', [id]);
    if (mailRes.rows.length === 0) return res.status(404).send();
    const existing = mailRes.rows[0];
    if (existing.version_id !== versionId) return res.status(409).json({ collision: true });

    let pdfPath = existing.pdf_path;
    if (deletePdf) {
      if (pdfPath) {
        const full = path.join(process.cwd(), pdfPath);
        if (fs.existsSync(full)) fs.unlinkSync(full);
        deleteSidecarMeta(pdfPath);
      }
      pdfPath = '';
    } else if (pdfData && pdfName) {
      const buffer = Buffer.from(pdfData, 'base64');
      const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
      const [year, month, day] = tTerima.split('-');
      const relDir = path.join('data', 'uploads', year, month, day).replace(/\\/g, '/');
      const absDir = path.join(process.cwd(), relDir);
      if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });
      const formatted = getFormattedPdfName(db.config, metadata, pdfName);
      const newRel = path.join(relDir, formatted).replace(/\\/g, '/');
      if (existing.pdf_path && existing.pdf_path !== newRel) {
        const oldFull = path.join(process.cwd(), existing.pdf_path);
        if (fs.existsSync(oldFull)) fs.unlinkSync(oldFull);
        deleteSidecarMeta(existing.pdf_path);
      }
      fs.writeFileSync(path.join(absDir, formatted), buffer);
      pdfPath = newRel;
    } else {
      pdfPath = await renameMailPdfFile(db.config, { ...existing, metadata, pdfPath: existing.pdf_path });
    }
    const metadataWithType = { ...metadata, type: req.body.type || existing.metadata?.type || 'Masuk' };
    await pool.query('UPDATE mails SET metadata = $1, pdf_path = $2, version_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4', [metadataWithType, pdfPath, existing.version_id + 1, id]);
    saveSidecarMeta({ id, metadata: metadataWithType, pdfPath, createdAt: existing.created_at });
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.delete('/api/mails/:id', async (req, res) => {
  try {
    const resMail = await pool.query('SELECT pdf_path FROM mails WHERE id = $1', [req.params.id]);
    if (resMail.rows.length > 0 && resMail.rows[0].pdf_path) {
      const full = path.join(process.cwd(), resMail.rows[0].pdf_path);
      if (fs.existsSync(full)) fs.unlinkSync(full);
      deleteSidecarMeta(resMail.rows[0].pdf_path);
    }
    await pool.query('DELETE FROM mails WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

// PDF Tools
app.post('/api/pdf/merge', async (req, res) => {
  try {
    const { pdfFiles } = req.body;
    const merged = await PDFDocument.create();
    for (const b64 of pdfFiles) {
      const doc = await PDFDocument.load(Buffer.from(b64, 'base64'));
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    res.send(Buffer.from(await merged.save()));
  } catch (err) { res.status(500).send(); }
});

app.post('/api/pdf/split', async (req, res) => {
  try {
    const { pdfData, range } = req.body;
    const doc = await PDFDocument.load(Buffer.from(pdfData, 'base64'));
    const split = await PDFDocument.create();
    const indices = range.split(',').flatMap((r: string) => {
      if (r.includes('-')) {
        const [s, e] = r.split('-').map(Number);
        return Array.from({ length: e - s + 1 }, (_, i) => s + i - 1);
      }
      return Number(r) - 1;
    });
    const pages = await split.copyPages(doc, indices);
    pages.forEach(p => split.addPage(p));
    res.send(Buffer.from(await split.save()));
  } catch (err) { res.status(500).send(); }
});

app.post('/api/pdf/compress', async (req, res) => {
  const inPath = path.join(os.tmpdir(), `in_${Date.now()}.pdf`);
  const outPath = path.join(os.tmpdir(), `out_${Date.now()}.pdf`);
  try {
    fs.writeFileSync(inPath, Buffer.from(req.body.pdfData, 'base64'));
    const level = req.body.level === 'high' ? '/screen' : (req.body.level === 'low' ? '/printer' : '/ebook');
    await execPromise(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${level} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outPath}" "${inPath}"`);
    res.send(fs.readFileSync(outPath));
  } catch (err) {
    const doc = await PDFDocument.load(Buffer.from(req.body.pdfData, 'base64'));
    res.send(Buffer.from(await doc.save({ useObjectStreams: true })));
  } finally {
    [inPath, outPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
  }
});

app.post('/api/pdf/receipt', async (req, res) => {
  try {
    const { mailIds, signerLeft, signerRight } = req.body;
    const db = await readDb();
    const selected = db.mails.filter((m: any) => mailIds.includes(m.id));
    if (selected.length === 0) return res.status(400).send();
    const doc = new jsPDF();
    doc.text(db.config.appName.toUpperCase(), 105, 15, { align: 'center' });
    doc.text('TANDA TERIMA PENYERAHAN SURAT', 105, 22, { align: 'center' });
    doc.line(15, 26, 195, 26);
    let y = 35;
    selected.forEach((m: any, i: number) => {
      doc.text(`${i+1}. ${m.metadata.noSurat || '-'} - ${m.metadata.perihal || '-'}`, 20, y);
      y += 10;
    });
    y += 10;
    doc.text(`Diserahkan oleh: ${signerLeft || '-'}`, 20, y);
    doc.text(`Diterima oleh: ${signerRight || '-'}`, 120, y);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(doc.output('arraybuffer')));
  } catch (err) { res.status(500).send(); }
});

app.post('/api/pdf/batch-download', async (req, res) => {
  try {
    const { mailIds } = req.body;
    const db = await readDb();
    const zip = new JSZip();
    db.mails.filter((m: any) => mailIds.includes(m.id) && m.pdfPath).forEach((m: any) => {
      const full = path.join(process.cwd(), m.pdfPath);
      if (fs.existsSync(full)) zip.file(path.basename(m.pdfPath), fs.readFileSync(full));
    });
    res.send(await zip.generateAsync({ type: 'nodebuffer' }));
  } catch (err) { res.status(500).send(); }
});

// Excel
app.get('/api/excel/export', async (req, res) => {
  try {
    const db = await readDb();
    const rows = db.mails.map((m: any, i: number) => {
      const r: any = { No: i + 1 };
      db.config.columns.forEach((c: any) => r[c.label] = m.metadata[c.key] || '');
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agenda');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { res.status(500).send(); }
});

app.post('/api/excel/import', express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }), async (req, res) => {
  try {
    const wb = XLSX.read(req.body, { type: 'buffer' });
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const db = await readDb();
    const cols = db.config.columns;
    for (const row of rows) {
      const meta: any = {};
      cols.forEach((c: any) => {
        const key = Object.keys(row).find(k => k.toLowerCase().includes(c.label.toLowerCase()) || k.toLowerCase().includes(c.key.toLowerCase()));
        if (key) meta[c.key] = row[key];
      });
      await pool.query('INSERT INTO mails (id, metadata, version_id) VALUES ($1, $2, $3)', [`mail_import_${Date.now()}_${Math.random()}`, meta, 1]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

// Backup
app.get('/api/backup/export-zip', async (req, res) => {
  try {
    const zip = new JSZip();
    const db = await readDb();
    zip.file('db_export.json', JSON.stringify(db, null, 2));
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) addDirectoryToZip(zip, uploadsDir, 'uploads');
    res.setHeader('Content-Type', 'application/zip');
    res.send(await zip.generateAsync({ type: 'nodebuffer' }));
  } catch (err) { res.status(500).send(); }
});

app.get('/api/backup/integrity', async (req, res) => {
  try {
    const db = await readDb();
    const missing: any[] = [];
    db.mails.forEach((m: any) => {
      if (m.pdfPath && !fs.existsSync(path.join(process.cwd(), m.pdfPath))) missing.push(m);
    });
    res.json({ success: true, missingCount: missing.length, missing });
  } catch (err) { res.status(500).send(); }
});

// Files
app.get('/api/files/*', (req, res) => {
  const rel = req.params[0];
  const full = path.join(process.cwd(), rel.startsWith('data/') ? '' : 'data', rel);
  if (fs.existsSync(full)) res.sendFile(full);
  else res.status(404).send();
});

/**
 * [SYSTEM_BOOTSTRAP]
 */
async function initDb() {
  const client = await pool.connect();
  try {
    logMessage('INFO', 'Initializing PostgreSQL Schema...');
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    await client.query(schema);
    const configCheck = await client.query('SELECT count(*) FROM config');
    if (parseInt(configCheck.rows[0].count) === 0) await client.query('INSERT INTO config (data) VALUES ($1)', [defaultDbConfig]);
    const userCheck = await client.query('SELECT count(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) await client.query('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)', ['admin', 'admin', 'Administrator', 'admin']);
    logMessage('INFO', 'PostgreSQL Ready');
  } catch (err: any) {
    logMessage('ERROR', `PG Failure: ${err.message}`);
    process.exit(1);
  } finally { client.release(); }
}

async function startServer() {
  await initDb();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => logMessage('INFO', `Server Active on http://localhost:${PORT}`));
}

startServer();
