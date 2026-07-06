import Database from 'better-sqlite3';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * [CORE_TECH] DATABASE PERSISTENCE - SQLite Compatibility Wrapper
 */
class SqliteClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  async query(sql: string, params: any[] = []) {
    let sqliteSql = sql.replace(/\$(\d+)/g, '?');

    // Handle schema script execution (multiple statements)
    if (sqliteSql.includes('CREATE TABLE')) {
      this.db.exec(sqliteSql);
      return { rows: [] };
    }

    // Handle cascade truncate emulation
    if (/truncate\s+table\s+mails,\s+config,\s+users\s+cascade/i.test(sqliteSql)) {
      this.db.prepare('DELETE FROM mails').run();
      this.db.prepare('DELETE FROM config').run();
      this.db.prepare('DELETE FROM users').run();
      try {
        this.db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('mails', 'config', 'users')").run();
      } catch (e) {}
      return { rows: [] };
    }

    const processedParams = params.map(p => {
      if (p !== null && typeof p === 'object') {
        return JSON.stringify(p);
      }
      return p;
    });

    const stmt = this.db.prepare(sqliteSql);
    const isSelect = stmt.reader;

    if (isSelect) {
      const rows = stmt.all(...processedParams);
      const processedRows = rows.map((row: any) => {
        const newRow = { ...row };
        
        if ('count(*)' in newRow) {
          newRow.count = newRow['count(*)'];
        }

        if (typeof newRow.data === 'string') {
          try { newRow.data = JSON.parse(newRow.data); } catch (e) {}
        }
        if (typeof newRow.metadata === 'string') {
          try { newRow.metadata = JSON.parse(newRow.metadata); } catch (e) {}
        }

        for (const key of ['created_at', 'updated_at', 'createdAt', 'updatedAt']) {
          if (row[key] !== undefined && row[key] !== null) {
            newRow[key] = new Date(row[key]).toISOString();
          }
        }
        return newRow;
      });
      return { rows: processedRows };
    } else {
      const info = stmt.run(...processedParams);
      return { rows: [], rowCount: info.changes };
    }
  }

  async release() {
    // No-op
  }
}

class SqlitePool {
  private client: SqliteClient;

  constructor(dbPath: string) {
    this.client = new SqliteClient(dbPath);
  }

  async connect() {
    return this.client;
  }

  async query(sql: string, params: any[] = []) {
    return this.client.query(sql, params);
  }

  on(event: string, callback: (...args: any[]) => void) {
    // No-op
  }
}

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

const pool = new SqlitePool(path.join(process.cwd(), 'data', 'database.db'));

const app = express();
const PORT = 3000;

// Body limit for PDF uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
    const mailsRes = await client.query('SELECT id, metadata, pdf_path as "pdfPath", created_at as "createdAt", updated_at as "updatedAt", version_id as "versionId" FROM mails ORDER BY created_at ASC');
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

async function restoreDbFromJson(dbData: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE mails, config, users CASCADE');
    
    // Restore config
    if (dbData.config) {
      await client.query('INSERT INTO config (data) VALUES ($1)', [dbData.config]);
    } else {
      await client.query('INSERT INTO config (data) VALUES ($1)', [defaultDbConfig]);
    }

    // Restore users
    if (dbData.users && Array.isArray(dbData.users)) {
      for (const u of dbData.users) {
        await client.query(
          'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
          [u.username, u.password, u.name, u.role]
        );
      }
    } else {
      await client.query('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)', ['admin', 'admin', 'Administrator', 'admin']);
    }

    // Restore mails
    if (dbData.mails && Array.isArray(dbData.mails)) {
      for (const m of dbData.mails) {
        await client.query(
          'INSERT INTO mails (id, metadata, pdf_path, version_id) VALUES ($1, $2, $3, $4)',
          [m.id, m.metadata || {}, m.pdfPath || null, m.versionId || 1]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function generateBackupFile(includePdf: boolean, type: 'manual' | 'auto' | 'pre_restore') {
  const db = await readDb();
  const timestamp = Date.now();
  const backupsDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  if (includePdf) {
    const filename = `backup_${type}_${timestamp}.zip`;
    const fullPath = path.join(backupsDir, filename);
    const zip = new JSZip();
    zip.file('db_export.json', JSON.stringify(db, null, 2));
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      addDirectoryToZip(zip, uploadsDir, 'uploads');
    }
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(fullPath, content);
    return { filename, sizeBytes: content.length };
  } else {
    const filename = `backup_${type}_${timestamp}.json`;
    const fullPath = path.join(backupsDir, filename);
    const content = JSON.stringify(db, null, 2);
    fs.writeFileSync(fullPath, content, 'utf-8');
    return { filename, sizeBytes: Buffer.byteLength(content) };
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
      const cleanBase64 = pdfData.includes(';base64,') ? pdfData.split(';base64,')[1] : pdfData;
      const buffer = Buffer.from(cleanBase64, 'base64');
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
      const cleanBase64 = pdfData.includes(';base64,') ? pdfData.split(';base64,')[1] : pdfData;
      const buffer = Buffer.from(cleanBase64, 'base64');
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

app.post('/api/mails/:id/upload', async (req, res) => {
  const { id } = req.params;
  const { pdfData } = req.body;
  try {
    if (!pdfData) {
      return res.status(400).json({ success: false, message: 'Data PDF kosong' });
    }
    const db = await readDb();
    const mailRes = await pool.query('SELECT * FROM mails WHERE id = $1', [id]);
    if (mailRes.rows.length === 0) return res.status(404).send();
    const existing = mailRes.rows[0];
    const metadata = existing.metadata || {};

    const cleanBase64 = pdfData.includes(';base64,') ? pdfData.split(';base64,')[1] : pdfData;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
    const [year, month, day] = tTerima.split('-');
    const relDir = path.join('data', 'uploads', year, month, day).replace(/\\/g, '/');
    const absDir = path.join(process.cwd(), relDir);
    if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });

    const formattedName = getFormattedPdfName(db.config, metadata, 'uploaded_document.pdf');
    const pdfPath = path.join(relDir, formattedName).replace(/\\/g, '/');
    fs.writeFileSync(path.join(absDir, formattedName), buffer);

    await pool.query('UPDATE mails SET pdf_path = $1, version_id = version_id + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [pdfPath, id]);
    saveSidecarMeta({ ...existing, pdf_path: pdfPath, metadata });

    res.json({ success: true, pdfPath });
  } catch (err: any) {
    logMessage('ERROR', `Gagal mengunggah PDF secara langsung: ${err.message}`);
    res.status(500).json({ success: false, message: 'Gagal memproses unggahan PDF.' });
  }
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
    
    // Create PDF document
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(db.config.appName.toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('TANDA TERIMA PENYERAHAN SURAT', 105, 22, { align: 'center' });
    doc.line(15, 26, 195, 26);
    
    // Columns to display (only where includeInReceipt !== false)
    const activeCols = db.config.columns
      .filter((c: any) => c.includeInReceipt !== false)
      .sort((a: any, b: any) => a.order - b.order);
      
    // Write table headers
    doc.setFontSize(9);
    let x = 15;
    let y = 35;
    
    // Draw columns headers
    activeCols.forEach((col: any) => {
      doc.text(col.label.substring(0, 15), x, y);
      x += 35;
    });
    
    doc.line(15, y + 2, 195, y + 2);
    y += 10;
    
    // Draw table rows
    selected.forEach((mail: any) => {
      x = 15;
      activeCols.forEach((col: any) => {
        let val = mail.metadata[col.key] || '-';
        if (col.type === 'date' && val !== '-') {
          try {
            val = new Date(val).toLocaleDateString('id-ID');
          } catch {}
        }
        doc.text(String(val).substring(0, 15), x, y);
        x += 35;
      });
      y += 8;
      
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });
    
    y += 10;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
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

// Backup & Recovery APIs
app.get('/api/backup/list', async (req, res) => {
  try {
    const backupsDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    
    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(f => f.startsWith('backup_') && (f.endsWith('.zip') || f.endsWith('.json')))
      .map(f => {
        const fullPath = path.join(backupsDir, f);
        const stats = fs.statSync(fullPath);
        const isZip = f.endsWith('.zip');
        const isManual = f.includes('manual');
        const isPreRestore = f.includes('pre_restore');
        const isAuto = f.includes('auto');
        
        let label = 'Cadangan Data';
        if (isManual) label = `Cadangan Manual (${isZip ? 'ZIP' : 'JSON'})`;
        else if (isPreRestore) label = `Cadangan Sebelum Pemulihan (${isZip ? 'ZIP' : 'JSON'})`;
        else if (isAuto) label = `Cadangan Otomatis (${isZip ? 'ZIP' : 'JSON'})`;
        
        return {
          filename: f,
          sizeBytes: stats.size,
          createdAt: stats.birthtime || stats.mtime || new Date(),
          label,
          isAuto,
          isManual,
          isPreRestore,
          isZip
        };
      });
      
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, backups });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/backup/create', async (req, res) => {
  try {
    const includePdf = req.body.includePdf !== false;
    const backup = await generateBackupFile(includePdf, 'manual');
    res.json({ success: true, backup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/backup/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Nama file tidak valid' });
    }
    const fullPath = path.join(process.cwd(), 'data', 'backups', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'File tidak ditemukan' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/backup/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).send('Nama file tidak valid');
    }
    const fullPath = path.join(process.cwd(), 'data', 'backups', filename);
    if (fs.existsSync(fullPath)) {
      res.download(fullPath);
    } else {
      res.status(404).send('File tidak ditemukan');
    }
  } catch (err) { res.status(500).send(); }
});

app.post('/api/backup/restore-local', async (req, res) => {
  try {
    const { filename } = req.body;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Nama file tidak valid' });
    }
    const fullPath = path.join(process.cwd(), 'data', 'backups', filename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
    }

    // Auto backup for safety before restoration
    await generateBackupFile(true, 'pre_restore');

    if (filename.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const dbData = JSON.parse(content);
      await restoreDbFromJson(dbData);
    } else if (filename.endsWith('.zip')) {
      const zipBuffer = fs.readFileSync(fullPath);
      const zip = await JSZip.loadAsync(zipBuffer);
      const dbFile = zip.file('db_export.json');
      if (dbFile) {
        const dbContent = await dbFile.async('text');
        const dbData = JSON.parse(dbContent);
        await restoreDbFromJson(dbData);
      }
      
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      for (const [relPath, file] of Object.entries(zip.files)) {
        if (relPath.startsWith('uploads/') && !file.dir) {
          const cleanRel = relPath.substring('uploads/'.length);
          const destPath = path.join(uploadsDir, cleanRel);
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.writeFileSync(destPath, await file.async('nodebuffer'));
        }
      }
    }
    
    res.json({ success: true, message: 'Sistem berhasil dipulihkan dari cadangan lokal!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal memulihkan dari cadangan lokal.' });
  }
});

app.post('/api/backup/import', async (req, res) => {
  try {
    await generateBackupFile(true, 'pre_restore');
    const dbData = req.body;
    await restoreDbFromJson(dbData);
    res.json({ success: true, message: 'Database berhasil dipulihkan dari backup!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal memulihkan database.' });
  }
});

app.post('/api/backup/import-zip', express.raw({ type: 'application/zip', limit: '100mb' }), async (req, res) => {
  try {
    await generateBackupFile(true, 'pre_restore');
    const zipBuffer = req.body;
    const zip = await JSZip.loadAsync(zipBuffer);
    const dbFile = zip.file('db_export.json');
    if (!dbFile) throw new Error('ZIP tidak valid (db_export.json tidak ditemukan)');
    
    const dbContent = await dbFile.async('text');
    const dbData = JSON.parse(dbContent);
    await restoreDbFromJson(dbData);

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    for (const [relPath, file] of Object.entries(zip.files)) {
      if (relPath.startsWith('uploads/') && !file.dir) {
        const cleanRel = relPath.substring('uploads/'.length);
        const destPath = path.join(uploadsDir, cleanRel);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(destPath, await file.async('nodebuffer'));
      }
    }

    res.json({ success: true, message: 'Sistem berhasil dipulihkan dari berkas ZIP cadangan!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal memulihkan dari berkas ZIP.' });
  }
});

app.post('/api/backup/clear', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE mails, config, users CASCADE');
      await client.query('INSERT INTO config (data) VALUES ($1)', [defaultDbConfig]);
      await client.query('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)', ['admin', 'admin', 'Administrator', 'admin']);
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally { client.release(); }

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    res.json({ success: true, message: 'Database & attachment uploads berhasil dibersihkan!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/backup/integrity/cleanup', async (req, res) => {
  try {
    const db = await readDb();
    const activePaths = new Set(db.mails.map((m: any) => m.pdfPath).filter(Boolean));
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    let deletedCount = 0;

    const cleanOrphans = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          cleanOrphans(fullPath);
          if (fs.readdirSync(fullPath).length === 0) fs.rmdirSync(fullPath);
        } else if (stats.isFile()) {
          const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          if (relPath.endsWith('.json')) {
            const pdfPair = relPath.substring(0, relPath.length - 5);
            if (!activePaths.has(pdfPair)) fs.unlinkSync(fullPath);
          } else if (relPath.endsWith('.pdf')) {
            if (!activePaths.has(relPath) && !activePaths.has(relPath.replace(/^data\//, ''))) {
              fs.unlinkSync(fullPath);
              deletedCount++;
              if (fs.existsSync(fullPath + '.json')) fs.unlinkSync(fullPath + '.json');
            }
          }
        }
      }
    };

    cleanOrphans(uploadsDir);
    res.json({ success: true, message: `Dibersihkan ${deletedCount} lampiran yatim (tidak memiliki record database).` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/backup/integrity/reconstruct', async (req, res) => {
  try {
    const db = await readDb();
    const activePaths = new Set(db.mails.map((m: any) => m.pdfPath).filter(Boolean));
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    let reconstructedCount = 0;

    const findAndReconstruct = async (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          await findAndReconstruct(fullPath);
        } else if (stats.isFile() && item.endsWith('.pdf')) {
          const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          const checkPath1 = relPath;
          const checkPath2 = relPath.startsWith('data/') ? relPath.substring(5) : relPath;
          
          if (!activePaths.has(checkPath1) && !activePaths.has(checkPath2)) {
            let meta: any = null;
            const sidecar = fullPath + '.json';
            if (fs.existsSync(sidecar)) {
              try {
                meta = JSON.parse(fs.readFileSync(sidecar, 'utf-8'));
              } catch {}
            }

            const mailId = `mail_reconstructed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const metadata = meta?.metadata || {
              noUrut: item.substring(0, 10).replace(/[^0-9]/g, '') || '000',
              tanggalTerima: new Date(stats.birthtime || stats.mtime).toISOString().split('T')[0],
              tanggalSurat: new Date(stats.birthtime || stats.mtime).toISOString().split('T')[0],
              jenisSurat: 'Masuk',
              noSurat: item.replace('.pdf', ''),
              suratDari: 'Direkonstruksi dari Lampiran',
              perihal: `Dokumen Lampiran: ${item}`,
              catatan: 'Rekonstruksi Integritas Otomatis'
            };

            await pool.query(
              'INSERT INTO mails (id, metadata, pdf_path, version_id) VALUES ($1, $2, $3, $4)',
              [mailId, metadata, checkPath2, 1]
            );
            reconstructedCount++;
          }
        }
      }
    };

    await findAndReconstruct(uploadsDir);
    res.json({ success: true, message: `Berhasil rekonstruksi ${reconstructedCount} agenda surat dari berkas lampiran yatim.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
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
  const rel = (req.params as any)[0];
  const full = path.join(process.cwd(), rel.startsWith('data/') ? '' : 'data', rel);
  if (fs.existsSync(full)) res.sendFile(full);
  else res.status(404).send();
});

/**
 * [SYSTEM_BOOTSTRAP]
 */
async function initDb() {
  let client;
  try {
    client = await pool.connect();
    logMessage('INFO', 'Initializing SQLite Schema...');
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    try {
      await client.query(schema);
    } catch (schemaErr: any) {
      logMessage('WARN', `Schema execution skipped/failed: ${schemaErr.message}`);
    }
    const configCheck = await client.query('SELECT count(*) FROM config');
    if (parseInt(configCheck.rows[0].count) === 0) await client.query('INSERT INTO config (data) VALUES ($1)', [defaultDbConfig]);
    const userCheck = await client.query('SELECT count(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) await client.query('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)', ['admin', 'admin', 'Administrator', 'admin']);
    logMessage('INFO', 'SQLite Ready');
  } catch (err: any) {
    logMessage('ERROR', `SQLite Failure: ${err.message}`);
  } finally {
    if (client) client.release();
  }
}

async function startServer() {
  await initDb();
  if (process.env.NODE_ENV !== 'production') {
    const srcBinary = path.join(process.cwd(), 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
    const destBinary = '/tmp/esbuild-main';
    try {
      if (fs.existsSync(srcBinary)) {
        fs.copyFileSync(srcBinary, destBinary);
        fs.chmodSync(destBinary, 0o755);
        process.env.ESBUILD_BINARY_PATH = destBinary;
      }
    } catch (e: any) {
      logMessage('WARN', `Failed to copy local esbuild binary, using global fallback: ${e.message}`);
      process.env.ESBUILD_BINARY_PATH = '/home/toor/.local/bin/esbuild';
    }
    const { createServer: createViteServer } = await import('vite');
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
