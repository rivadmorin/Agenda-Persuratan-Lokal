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

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mail_agenda',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const app = express();
const PORT = 3000;

// Increase body limit for PDF base64 uploads
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

// Logger Function
function logMessage(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logLine.trim());
  try {
    const logDir = path.join(process.cwd(), 'data', 'logs');
    const logFile = path.join(logDir, 'app.log');
    fs.appendFileSync(logFile, logLine);
    
    // Rotating logger: limit to 5MB, rotate up to 3 files
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > 5 * 1024 * 1024) {
        for (let i = 2; i >= 1; i--) {
          const oldFile = path.join(logDir, `app.${i}.log`);
          const nextFile = path.join(logDir, `app.${i + 1}.log`);
          if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, nextFile);
          }
        }
        fs.renameSync(logFile, path.join(logDir, 'app.1.log'));
      }
    }
  } catch (err) {
    // Silently ignore logging write errors
  }
}

// Database JSON Store Setup
const dbPath = path.join(process.cwd(), 'data', 'db.json');

const defaultDb = {
  users: [
    { username: 'admin', name: 'Administrator', role: 'admin', password: 'admin' }
  ],
  mails: [],
  config: {
    appName: 'Agenda Persuratan Kantor',
    themeColor: '#2563eb',
    autoCompressPdf: true,
    pdfCompressionLevel: 'medium',
    maxUploadSizeMb: 50,
    backupRetentionDays: 7,
    backupRetentionWeeks: 4,
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
  }
};

class SimpleMutex {
  private queue: Promise<any> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = next;
    await current;
    return release!;
  }
}
const dbMutex = new SimpleMutex();

function saveSidecarMeta(mail: any) {
  if (!mail || !mail.pdfPath) return;
  try {
    const fullPath = path.join(process.cwd(), mail.pdfPath);
    const metaPath = fullPath + '.json';
    const metaDir = path.dirname(metaPath);
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    fs.writeFileSync(metaPath, JSON.stringify(mail, null, 2), 'utf-8');
    logMessage('INFO', `Saved sidecar metadata for mail ${mail.id} at ${mail.pdfPath}.json`);
  } catch (err: any) {
    logMessage('ERROR', `Failed to save sidecar metadata for mail ${mail?.id}: ${err.message}`);
  }
}

function deleteSidecarMeta(pdfPath: string) {
  if (!pdfPath) return;
  try {
    const metaPath = path.join(process.cwd(), pdfPath) + '.json';
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
      logMessage('INFO', `Deleted sidecar metadata: ${pdfPath}.json`);
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed to delete sidecar metadata for ${pdfPath}: ${err.message}`);
  }
}

function renameSidecarMeta(oldPdfPath: string, newPdfPath: string) {
  if (!oldPdfPath || !newPdfPath || oldPdfPath === newPdfPath) return;
  try {
    const oldMetaPath = path.join(process.cwd(), oldPdfPath) + '.json';
    const newMetaPath = path.join(process.cwd(), newPdfPath) + '.json';
    if (fs.existsSync(oldMetaPath)) {
      const newMetaDir = path.dirname(newMetaPath);
      if (!fs.existsSync(newMetaDir)) {
        fs.mkdirSync(newMetaDir, { recursive: true });
      }
      fs.renameSync(oldMetaPath, newMetaPath);
      logMessage('INFO', `Renamed sidecar metadata from ${oldPdfPath}.json to ${newPdfPath}.json`);
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed to rename sidecar metadata from ${oldPdfPath} to ${newPdfPath}: ${err.message}`);
  }
}

function generateMissingSidecars(db: any) {
  try {
    let count = 0;
    if (!db || !Array.isArray(db.mails)) return;
    db.mails.forEach((mail: any) => {
      if (mail.pdfPath) {
        const fullPath = path.join(process.cwd(), mail.pdfPath);
        const metaPath = fullPath + '.json';
        if (fs.existsSync(fullPath) && !fs.existsSync(metaPath)) {
          saveSidecarMeta(mail);
          count++;
        }
      }
    });
    if (count > 0) {
      logMessage('INFO', `Generated ${count} missing sidecar metadata files for existing mails.`);
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed to generate missing sidecars: ${err.message}`);
  }
}

function readDbSync() {
  try {
    if (!fs.existsSync(dbPath)) {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(defaultDb));
    }
    const content = fs.readFileSync(dbPath, 'utf-8');
    if (!content.trim()) {
      throw new Error("Database file is empty");
    }
    const db = JSON.parse(content);
    return db;
  } catch (err: any) {
    logMessage('ERROR', `Failed to read DB: ${err.message}`);
    // Try to auto-recover from the latest backup!
    try {
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
          .map(f => {
            const p = path.join(backupDir, f);
            return { name: f, path: p, mtime: fs.statSync(p).mtimeMs };
          })
          .sort((a, b) => b.mtime - a.mtime);
        
        if (files.length > 0) {
          const latestBackup = files[0];
          logMessage('WARN', `Attempting auto-recovery from latest backup: ${latestBackup.name}`);
          const backupContent = fs.readFileSync(latestBackup.path, 'utf-8');
          const db = JSON.parse(backupContent);
          // Restore the corrupted file from backup safely using atomic write
          const tempPath = dbPath + '.tmp';
          fs.writeFileSync(tempPath, backupContent, 'utf-8');
          fs.renameSync(tempPath, dbPath);
          logMessage('INFO', `Database successfully recovered from backup: ${latestBackup.name}`);
          return db;
        }
      }
    } catch (recoveryErr: any) {
      logMessage('ERROR', `Failed to recover database from backup: ${recoveryErr.message}`);
    }
    return JSON.parse(JSON.stringify(defaultDb));
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, dbPath);
  } catch (err: any) {
    logMessage('ERROR', `Failed to write DB: ${err.message}`);
  }
}

function getFormattedPdfName(db: any, metadata: any, originalName: string) {
  const config = db.config || {};
  const autoRename = config.autoRenamePdf !== false;
  
  // Dynamic fallback for rename columns: first 3 columns from actual system config if empty or invalid
  let pdfRenameCols = config.pdfRenameCols;
  if (!pdfRenameCols || pdfRenameCols.length === 0) {
    const cols = config.columns || [];
    pdfRenameCols = cols.slice(0, 3).map((c: any) => c.key);
  }

  if (autoRename && pdfRenameCols.length > 0) {
    const nameParts: string[] = [];
    pdfRenameCols.forEach((colKey: string) => {
      let val = metadata[colKey];
      
      // Case-insensitive key matching for imported or legacy keys
      if (val === undefined || val === null || String(val).trim() === '') {
        const lowerKey = colKey.toLowerCase();
        const foundKey = Object.keys(metadata).find(k => k.toLowerCase() === lowerKey);
        if (foundKey) {
          val = metadata[foundKey];
        }
      }

      // Label-based fallback matching if key names still differ
      if (val === undefined || val === null || String(val).trim() === '') {
        const colDef = (config.columns || []).find((c: any) => c.key === colKey);
        if (colDef) {
          const labelLower = colDef.label.toLowerCase();
          const foundKey = Object.keys(metadata).find(k => {
            const kl = k.toLowerCase();
            return kl.includes(labelLower) || labelLower.includes(kl);
          });
          if (foundKey) {
            val = metadata[foundKey];
          }
        }
      }

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const cleanVal = String(val).replace(/[^a-zA-Z0-9-_]/g, '_');
        nameParts.push(cleanVal);
      }
    });

    if (nameParts.length > 0) {
      return nameParts.join('-') + '.pdf';
    }
  }

  // Fallback to sanitizing original pdfName or default name
  if (originalName) {
    const baseName = path.basename(originalName, path.extname(originalName));
    const cleanBase = baseName.replace(/[^a-zA-Z0-9-_]/g, '_') || 'dokumen';
    return `${cleanBase}.pdf`;
  }

  // Last resort fallback
  const keys = Object.keys(metadata);
  const values = keys.slice(0, 3).map(k => String(metadata[k] || '').replace(/[^a-zA-Z0-9-_]/g, '_')).filter(v => v);
  if (values.length > 0) {
    return values.join('-') + '.pdf';
  }
  return `dokumen_${Date.now()}.pdf`;
}

function renameMailPdfFile(db: any, mail: any) {
  if (!mail.pdfPath) return mail.pdfPath;

  try {
    const config = db.config || {};
    const autoRename = config.autoRenamePdf !== false;
    if (!autoRename) return mail.pdfPath;

    const oldRelativePath = mail.pdfPath;
    const oldFullPath = path.join(process.cwd(), oldRelativePath);

    if (!fs.existsSync(oldFullPath)) {
      return mail.pdfPath;
    }

    const metadata = mail.metadata || {};
    const originalName = path.basename(oldRelativePath);
    const formattedName = getFormattedPdfName(db, metadata, originalName);

    const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
    const [year, month, day] = tTerima.split('-');
    const relativeUploadDir = path.join('data', 'uploads', year || 'unknown', month || 'unknown', day || 'unknown');
    const uploadDir = path.join(process.cwd(), relativeUploadDir);

    const newRelativePath = path.join(relativeUploadDir, formattedName).replace(/\\/g, '/');
    const newFullPath = path.join(uploadDir, formattedName);

    if (oldFullPath !== newFullPath) {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.renameSync(oldFullPath, newFullPath);
      renameSidecarMeta(oldRelativePath, newRelativePath);
      logMessage('INFO', `Physically renamed PDF from ${oldRelativePath} to ${newRelativePath}`);
      return newRelativePath;
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed renaming PDF file on disk: ${err.message}`);
  }

  return mail.pdfPath;
}

// Helper to add entire directory recursively to a JSZip object
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
      const fileBytes = fs.readFileSync(fullLocalPath);
      zip.file(relativeZipPath, fileBytes);
    }
  }
}

// Perform Auto Backup & Cleanup
function performBackup() {
  try {
    if (!fs.existsSync(dbPath)) return;
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `db_backup_${timestamp}.json`);
    
    fs.copyFileSync(dbPath, backupFile);
    logMessage('INFO', `Database backup created: ${path.basename(backupFile)}`);
    
    // Clean old backups
    const db = readDbSync();
    const retentionDays = db.config?.backupRetentionDays || 7;
    const files = fs.readdirSync(backupDir);
    const msThreshold = retentionDays * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      if (file.startsWith('db_backup_') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const ageMs = Date.now() - stats.mtimeMs;
        if (ageMs > msThreshold) {
          fs.unlinkSync(filePath);
          logMessage('INFO', `Removed expired backup file: ${file}`);
        }
      }
    }
  } catch (err: any) {
    logMessage('ERROR', `Backup failed: ${err.message}`);
  }
}

// Initial Run: Check integrity, run backup
logMessage('INFO', 'Starting Agenda Persuratan Server...');
performBackup();

// Active SSE Connections and Session Tracker
interface ActiveSession {
  username: string;
  name: string;
  role: string;
  lastActive: number;
}
let activeSessions: Record<string, ActiveSession> = {};
let sseClients: any[] = [];

// Helper to broadcast online users to SSE clients
function broadcastOnlineUsers() {
  const now = Date.now();
  // Clear sessions older than 30 seconds
  Object.keys(activeSessions).forEach((username) => {
    if (now - activeSessions[username].lastActive > 30000) {
      delete activeSessions[username];
    }
  });

  const onlineList = Object.values(activeSessions).map((s) => ({
    username: s.username,
    name: s.name,
    role: s.role,
  }));

  const dataString = JSON.stringify({
    count: onlineList.length,
    users: onlineList,
  });

  sseClients.forEach((res) => {
    res.write(`data: ${dataString}\n\n`);
  });
}

// Keep SSE connections alive and prune old sessions
setInterval(() => {
  broadcastOnlineUsers();
}, 5000);

// Middleware to track activity of users
function trackActivity(req: express.Request, res: express.Response, next: express.NextFunction) {
  const username = req.headers['x-username'] as string;
  const name = req.headers['x-user-name'] as string;
  const role = req.headers['x-user-role'] as string;

  if (username && name && role) {
    activeSessions[username] = {
      username,
      name,
      role,
      lastActive: Date.now(),
    };
  }
  next();
}
app.use(trackActivity);

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. App / Server Info
app.get('/api/info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ips: string[] = ['localhost', '127.0.0.1'];
  for (const interfaceName of Object.keys(networkInterfaces)) {
    const list = networkInterfaces[interfaceName];
    if (list) {
      for (const info of list) {
        if (info.family === 'IPv4' && !info.internal) {
          ips.push(info.address);
        }
      }
    }
  }
  res.json({ ips, port: PORT });
});

// 2. Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await readDb();
  const user = db.users.find(
    (u: any) => u.username === username && u.password === password
  );

  if (user) {
    const { password, ...safeUser } = user;
    activeSessions[username] = {
      username: safeUser.username,
      name: safeUser.name,
      role: safeUser.role,
      lastActive: Date.now(),
    };
    broadcastOnlineUsers();
    logMessage('INFO', `User logged in: ${username}`);
    res.json({ success: true, user: safeUser });
  } else {
    res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const { username } = req.body;
  if (username && activeSessions[username]) {
    delete activeSessions[username];
    broadcastOnlineUsers();
    logMessage('INFO', `User logged out: ${username}`);
  }
  res.json({ success: true });
});

// SSE for Online Users
app.get('/api/users/online', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  broadcastOnlineUsers();

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// 3. User Management
app.get('/api/users', async (req, res) => {
  const db = await readDb();
  const safeUsers = db.users.map(({ password, ...u }: any) => u);
  res.json(safeUsers);
});

app.post('/api/users', async (req, res) => {
  const { username, name, role, password } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
      [username, password, name, role]
    );
    logMessage('INFO', `Created user in PG: ${username} (${role})`);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ message: 'Username sudah digunakan.' });
    res.status(500).json({ message: 'Gagal membuat user.' });
  }
});

app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const { name, role, password } = req.body;
  const db = readDbSync();
  const index = db.users.findIndex((u: any) => u.username === username);
  if (index !== -1) {
    db.users[index].name = name;
    db.users[index].role = role;
    if (password) {
      db.users[index].password = password;
    }
    writeDb(db);
    logMessage('INFO', `Updated user details: ${username}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'User tidak ditemukan.' });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') {
    return res.status(400).json({ message: 'User admin bawaan tidak dapat dihapus.' });
  }
  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    logMessage('INFO', `Deleted user from PG: ${username}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus user.' });
  }
});

// 4. Config Management
app.get('/api/config', async (req, res) => {
  const db = await readDb();
  res.json(db.config);
});

app.post('/api/config', async (req, res) => {
  const db = await readDb();
  db.config = { ...db.config, ...req.body };
  
  // Physically rename all existing PDFs on disk to match new column renaming settings!
  if (db.config.autoRenamePdf !== false && db.mails && db.mails.length > 0) {
    db.mails.forEach((mail: any) => {
      if (mail.pdfPath) {
        mail.pdfPath = renameMailPdfFile(db, mail);
      }
    });
  }

  try {
    await pool.query('UPDATE config SET data = $1', [db.config]);
    // Also sync the mails back if renamed
    if (db.config.autoRenamePdf !== false && db.mails && db.mails.length > 0) {
       for (const mail of db.mails) {
         await pool.query('UPDATE mails SET pdf_path = $1 WHERE id = $2', [mail.pdfPath, mail.id]);
       }
    }
    writeDb(db); // JSON sync
    logMessage('INFO', 'Application configuration updated and existing PDFs renamed');
    res.json({ success: true, config: db.config });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal memperbarui konfigurasi.' });
  }
});

app.post('/api/config/columns/reorder', (req, res) => {
  const { columns } = req.body;
  const db = readDbSync();
  db.config.columns = columns;
  writeDb(db);
  logMessage('INFO', 'Columns reordered successfully');
  res.json({ success: true });
});

// 4.5. Backup, Restore, and Clear Management
app.get('/api/backup/export', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const db = readDbSync();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=agenda_surat_backup_${dateStr}.json`);
    res.send(JSON.stringify(db, null, 2));
    logMessage('INFO', 'Database backup exported manually');
  } catch (err: any) {
    logMessage('ERROR', `Backup export failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengekspor pencadangan data.' });
  } finally {
    release();
  }
});

app.get('/api/backup/export-zip', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const zip = new JSZip();
    
    // 1. Add database db.json
    if (fs.existsSync(dbPath)) {
      zip.file('db.json', fs.readFileSync(dbPath));
    }
    
    // 2. Add uploaded PDFs recursively
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      addDirectoryToZip(zip, uploadsDir, 'uploads');
    }
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=agenda_surat_backup_lengkap_${new Date().toISOString().slice(0, 10)}.zip`);
    res.send(zipBuffer);
    logMessage('INFO', 'Database full backup (with PDFs) exported manually');
  } catch (err: any) {
    logMessage('ERROR', `Full backup export failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengekspor pencadangan lengkap (ZIP + PDF).' });
  } finally {
    release();
  }
});

app.post('/api/backup/import', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ message: 'Data pencadangan tidak ditemukan.' });
    }

    let parsed: any;
    if (typeof backupData === 'string') {
      parsed = JSON.parse(backupData);
    } else {
      parsed = backupData;
    }

    // Validation: make sure it has basic structure of db.json
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.mails) || !parsed.config) {
      return res.status(400).json({ message: 'Format berkas cadangan tidak valid.' });
    }

    writeDb(parsed);
    logMessage('INFO', `Database restored successfully from manual import. Mails count: ${parsed.mails.length}`);
    res.json({ success: true, message: 'Data berhasil dipulihkan dari berkas cadangan.' });
  } catch (err: any) {
    logMessage('ERROR', `Backup import failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal memulihkan data pencadangan: Format tidak sesuai.' });
  } finally {
    release();
  }
});

app.post('/api/backup/clear', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const db = readDbSync();
    
    // Physical cleanup of upload directory
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const deleteFolderRecursive = (dirPath: string) => {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          if (dirPath !== uploadsDir) {
            fs.rmdirSync(dirPath);
          }
        }
      };
      deleteFolderRecursive(uploadsDir);
    }

    // Clear all mails but keep users & configs
    db.mails = [];
    writeDb(db);

    logMessage('INFO', 'All mail records and physical attachment files have been cleared successfully.');
    res.json({ success: true, message: 'Semua data agenda surat dan lampiran fisik berhasil dikosongkan.' });
  } catch (err: any) {
    logMessage('ERROR', `Failed to clear database: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengosongkan data.' });
  } finally {
    release();
  }
});

// GET /api/backup/list
app.get('/api/backup/list', (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter((file) => file.endsWith('.json') || file.endsWith('.zip'))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        let label = 'Auto Backup (JSON)';
        if (file.endsWith('.zip')) {
          label = 'Full Backup (ZIP + PDF)';
        } else if (file.includes('_manual_')) {
          label = 'Manual Backup (JSON)';
        } else if (file.includes('pre_restore')) {
          label = 'Pre-Restore Safe-point';
        }
        return {
          filename: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
          label,
          isAuto: file.startsWith('db_backup_') && !file.includes('_manual_') && !file.includes('pre_restore'),
          isManual: file.includes('_manual_'),
          isPreRestore: file.includes('pre_restore'),
          isZip: file.endsWith('.zip')
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ success: true, backups: backupFiles });
  } catch (err: any) {
    logMessage('ERROR', `Failed to list backups: ${err.message}`);
    res.status(500).json({ message: 'Gagal mendapatkan daftar pencadangan.' });
  }
});

// POST /api/backup/create
app.post('/api/backup/create', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const { includePdf } = req.body;
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');

    if (includePdf) {
      // Create ZIP with database and uploaded PDF attachments
      const filename = `db_backup_manual_${timestamp}.zip`;
      const backupFile = path.join(backupDir, filename);
      
      const zip = new JSZip();
      
      // 1. Add database db.json
      if (fs.existsSync(dbPath)) {
        zip.file('db.json', fs.readFileSync(dbPath));
      }
      
      // 2. Add uploaded PDFs recursively
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        addDirectoryToZip(zip, uploadsDir, 'uploads');
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      fs.writeFileSync(backupFile, zipBuffer);
      logMessage('INFO', `Manual ZIP backup with PDFs created: ${filename}`);
      res.json({ success: true, message: 'Pencadangan manual (Database + PDF) berhasil dibuat.', filename, isZip: true });
    } else {
      // Create JSON only backup
      const filename = `db_backup_manual_${timestamp}.json`;
      const backupFile = path.join(backupDir, filename);
      fs.copyFileSync(dbPath, backupFile);
      logMessage('INFO', `Manual database-only backup created: ${filename}`);
      res.json({ success: true, message: 'Pencadangan manual (Database JSON) berhasil dibuat.', filename, isZip: false });
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed to create manual backup: ${err.message}`);
    res.status(500).json({ message: `Gagal membuat pencadangan: ${err.message}` });
  } finally {
    release();
  }
});

// POST /api/backup/restore-local
app.post('/api/backup/restore-local', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Nama file cadangan tidak ditentukan.' });
    }
    const cleanFilename = path.basename(filename);
    const backupFile = path.join(process.cwd(), 'data', 'backups', cleanFilename);
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ message: 'Berkas cadangan tidak ditemukan.' });
    }

    const isZip = cleanFilename.endsWith('.zip');
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    const timestamp = new Date().getTime();

    // Always create a pre-restore safety copy of the current database
    const preRestoreFilename = `db_backup_pre_restore_${timestamp}.json`;
    fs.copyFileSync(dbPath, path.join(backupDir, preRestoreFilename));

    if (isZip) {
      const zipBuffer = fs.readFileSync(backupFile);
      const zip = await JSZip.loadAsync(zipBuffer);
      
      // 1. Extract and validate db.json from ZIP
      const dbFile = zip.file('db.json');
      if (!dbFile) {
        return res.status(400).json({ message: 'File db.json tidak ditemukan di dalam arsip cadangan.' });
      }
      const dbContent = await dbFile.async('string');
      const parsed = JSON.parse(dbContent);
      
      if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.mails) || !parsed.config) {
        return res.status(400).json({ message: 'Format berkas database di dalam ZIP tidak valid.' });
      }

      // 2. Extract uploads/ directory containing PDFs back to disk
      const uploadsKeys = Object.keys(zip.files).filter(key => key.startsWith('uploads/') && !zip.files[key].dir);
      let extractedCount = 0;
      for (const key of uploadsKeys) {
        const file = zip.file(key);
        if (file) {
          const fileBytes = await file.async('nodebuffer');
          const destPath = path.join(process.cwd(), 'data', key);
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.writeFileSync(destPath, fileBytes);
          extractedCount++;
        }
      }

      // 3. Write back database
      writeDb(parsed);
      logMessage('INFO', `Database and ${extractedCount} PDF physical attachments successfully restored from ZIP backup: ${cleanFilename}`);
      res.json({ success: true, message: `Berhasil memulihkan database dan ${extractedCount} file lampiran PDF ke kondisi: ${cleanFilename}` });
    } else {
      // Normal JSON restore
      const content = fs.readFileSync(backupFile, 'utf-8');
      const parsed = JSON.parse(content);
      
      if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.mails) || !parsed.config) {
        return res.status(400).json({ message: 'Format berkas cadangan tidak valid.' });
      }

      writeDb(parsed);
      logMessage('INFO', `Database successfully restored from JSON backup: ${cleanFilename}`);
      res.json({ success: true, message: `Berhasil memulihkan database ke kondisi: ${cleanFilename}` });
    }
  } catch (err: any) {
    logMessage('ERROR', `Failed to restore local backup: ${err.message}`);
    res.status(500).json({ message: `Gagal memulihkan data: ${err.message}` });
  } finally {
    release();
  }
});

// POST /api/backup/import-zip
app.post('/api/backup/import-zip', express.raw({ type: 'application/zip', limit: '100mb' }), async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const zipBuffer = req.body;
    if (!zipBuffer || zipBuffer.length === 0) {
      return res.status(400).json({ message: 'Arsip ZIP cadangan kosong atau tidak valid.' });
    }

    const zip = await JSZip.loadAsync(zipBuffer);
    
    // 1. Extract and validate db.json from ZIP
    const dbFile = zip.file('db.json');
    if (!dbFile) {
      return res.status(400).json({ message: 'File db.json tidak ditemukan di dalam berkas ZIP.' });
    }
    const dbContent = await dbFile.async('string');
    const parsed = JSON.parse(dbContent);
    
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.mails) || !parsed.config) {
      return res.status(400).json({ message: 'Format database di dalam berkas ZIP tidak valid.' });
    }

    // 2. Quick safety copy of current db before restoring
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    const timestamp = new Date().getTime();
    const preRestoreFilename = `db_backup_pre_restore_${timestamp}.json`;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(dbPath, path.join(backupDir, preRestoreFilename));

    // 3. Extract uploads/ directory files back to disk
    const uploadsKeys = Object.keys(zip.files).filter(key => key.startsWith('uploads/') && !zip.files[key].dir);
    let extractedCount = 0;
    for (const key of uploadsKeys) {
      const file = zip.file(key);
      if (file) {
        const fileBytes = await file.async('nodebuffer');
        const destPath = path.join(process.cwd(), 'data', key);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.writeFileSync(destPath, fileBytes);
        extractedCount++;
      }
    }

    // 4. Save Database
    writeDb(parsed);
    logMessage('INFO', `Successfully imported backup ZIP with ${extractedCount} PDF attachments`);
    res.json({ success: true, message: `Berhasil memulihkan database dan ${extractedCount} file lampiran PDF.` });
  } catch (err: any) {
    logMessage('ERROR', `Failed to import ZIP backup: ${err.message}`);
    res.status(500).json({ message: `Gagal mengimpor arsip cadangan ZIP: ${err.message}` });
  } finally {
    release();
  }
});

// DELETE /api/backup/delete/:filename
app.delete('/api/backup/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ message: 'Nama file tidak boleh kosong.' });
    }
    const cleanFilename = path.basename(filename);
    const backupFile = path.join(process.cwd(), 'data', 'backups', cleanFilename);
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ message: 'Berkas cadangan tidak ditemukan.' });
    }

    fs.unlinkSync(backupFile);
    logMessage('INFO', `Backup file deleted: ${cleanFilename}`);
    res.json({ success: true, message: `Berkas cadangan ${cleanFilename} berhasil dihapus.` });
  } catch (err: any) {
    logMessage('ERROR', `Failed to delete backup file: ${err.message}`);
    res.status(500).json({ message: 'Gagal menghapus berkas cadangan.' });
  }
});

// GET /api/backup/download/:filename
app.get('/api/backup/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ message: 'Nama file tidak boleh kosong.' });
    }
    const cleanFilename = path.basename(filename);
    const backupFile = path.join(process.cwd(), 'data', 'backups', cleanFilename);
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ message: 'Berkas cadangan tidak ditemukan.' });
    }

    const isZip = cleanFilename.endsWith('.zip');
    res.setHeader('Content-Type', isZip ? 'application/zip' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${cleanFilename}`);
    const stream = fs.createReadStream(backupFile);
    stream.pipe(res);
    logMessage('INFO', `Backup file downloaded: ${cleanFilename}`);
  } catch (err: any) {
    logMessage('ERROR', `Failed to download backup file: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengunduh berkas cadangan.' });
  }
});

// GET /api/backup/integrity - Verify DB-to-file consistency
app.get('/api/backup/integrity', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const db = await readDb();
    
    // 1. Get all referenced PDF paths from database
    const referencedPaths = new Set(
      db.mails
        .map((mail: any) => mail.pdfPath)
        .filter((p: any) => typeof p === 'string' && p.trim() !== '')
        .map((p: string) => p.replace(/\\/g, '/').toLowerCase())
    );

    // Helper to determine if a file is an orphan
    const isOrphan = (filePath: string): boolean => {
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      const normalizedPath = relativePath.toLowerCase();

      if (normalizedPath.endsWith('.pdf')) {
        return !referencedPaths.has(normalizedPath);
      }
      if (normalizedPath.endsWith('.pdf.json')) {
        const pdfNormalizedPath = normalizedPath.slice(0, -5); // strip '.json'
        return !referencedPaths.has(pdfNormalizedPath);
      }
      return true;
    };

    // Helper for recursive file scan
    const getAllFilesRecursive = (dirPath: string): string[] => {
      let results: string[] = [];
      if (!fs.existsSync(dirPath)) return results;
      const list = fs.readdirSync(dirPath);
      list.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFilesRecursive(filePath));
        } else {
          results.push(filePath);
        }
      });
      return results;
    };

    // 2. Scan all physical files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const allPhysicalFiles = getAllFilesRecursive(uploadsDir);

    const orphans: any[] = [];
    allPhysicalFiles.forEach((filePath) => {
      if (isOrphan(filePath)) {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        const stats = fs.statSync(filePath);
        orphans.push({
          path: relativePath,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString()
        });
      }
    });

    // 3. Scan for missing physical files referenced in the DB
    const missing: any[] = [];
    db.mails.forEach((mail: any) => {
      if (mail.pdfPath && mail.pdfPath.trim() !== '') {
        const fullPath = path.join(process.cwd(), mail.pdfPath);
        if (!fs.existsSync(fullPath)) {
          missing.push({
            mailId: mail.id,
            noSurat: mail.metadata?.noSurat || 'N/A',
            perihal: mail.metadata?.perihal || 'N/A',
            tanggalSurat: mail.metadata?.tanggalSurat || 'N/A',
            pdfPath: mail.pdfPath
          });
        }
      }
    });

    const totalMails = db.mails.length;
    const totalMailsWithPdf = db.mails.filter((m: any) => m.pdfPath && m.pdfPath.trim() !== '').length;
    const totalPdfsOnDisk = allPhysicalFiles.length;
    const totalSizeOrphans = orphans.reduce((sum, item) => sum + item.sizeBytes, 0);

    logMessage('INFO', `Integrity check completed: Found ${orphans.length} orphans, ${missing.length} missing files.`);
    res.json({
      success: true,
      stats: {
        totalMails,
        totalMailsWithPdf,
        totalPdfsOnDisk,
        orphanCount: orphans.length,
        missingCount: missing.length,
        totalSizeOrphans
      },
      orphans: orphans.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      missing
    });
  } catch (err: any) {
    logMessage('ERROR', `Integrity check failed: ${err.message}`);
    res.status(500).json({ message: `Gagal memeriksa integritas sistem: ${err.message}` });
  } finally {
    release();
  }
});

// POST /api/backup/integrity/cleanup - Clean orphan PDFs and empty subdirectories
app.post('/api/backup/integrity/cleanup', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const db = await readDb();
    
    const referencedPaths = new Set(
      db.mails
        .map((mail: any) => mail.pdfPath)
        .filter((p: any) => typeof p === 'string' && p.trim() !== '')
        .map((p: string) => p.replace(/\\/g, '/').toLowerCase())
    );

    // Helper to determine if a file is an orphan
    const isOrphan = (filePath: string): boolean => {
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      const normalizedPath = relativePath.toLowerCase();

      if (normalizedPath.endsWith('.pdf')) {
        return !referencedPaths.has(normalizedPath);
      }
      if (normalizedPath.endsWith('.pdf.json')) {
        const pdfNormalizedPath = normalizedPath.slice(0, -5); // strip '.json'
        return !referencedPaths.has(pdfNormalizedPath);
      }
      return true;
    };

    const getAllFilesRecursive = (dirPath: string): string[] => {
      let results: string[] = [];
      if (!fs.existsSync(dirPath)) return results;
      const list = fs.readdirSync(dirPath);
      list.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFilesRecursive(filePath));
        } else {
          results.push(filePath);
        }
      });
      return results;
    };

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const allPhysicalFiles = getAllFilesRecursive(uploadsDir);

    let deletedCount = 0;
    let reclaimedBytes = 0;

    allPhysicalFiles.forEach((filePath) => {
      if (isOrphan(filePath)) {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        try {
          const stats = fs.statSync(filePath);
          reclaimedBytes += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          logMessage('INFO', `Deleted orphan file: ${relativePath}`);
        } catch (unlinkErr: any) {
          const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
          logMessage('WARN', `Failed to delete orphan file ${relativePath}: ${unlinkErr.message}`);
        }
      }
    });

    // Clean empty subdirectories in data/uploads
    const cleanEmptyDirsRecursive = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const stat = fs.statSync(dirPath);
      if (!stat.isDirectory()) return;

      let files = fs.readdirSync(dirPath);
      if (files.length > 0) {
        files.forEach((file) => {
          cleanEmptyDirsRecursive(path.join(dirPath, file));
        });
        files = fs.readdirSync(dirPath);
      }

      const rootUploads = path.join(process.cwd(), 'data', 'uploads');
      if (files.length === 0 && dirPath !== rootUploads) {
        try {
          fs.rmdirSync(dirPath);
          logMessage('INFO', `Removed empty subdirectory: ${path.relative(process.cwd(), dirPath)}`);
        } catch (rmdirErr: any) {
          logMessage('WARN', `Failed to remove directory ${dirPath}: ${rmdirErr.message}`);
        }
      }
    };

    cleanEmptyDirsRecursive(uploadsDir);

    logMessage('INFO', `Integrity cleanup completed: Deleted ${deletedCount} orphan files, reclaimed ${reclaimedBytes} bytes.`);
    res.json({
      success: true,
      deletedCount,
      reclaimedBytes
    });
  } catch (err: any) {
    logMessage('ERROR', `Integrity cleanup failed: ${err.message}`);
    res.status(500).json({ message: `Gagal membersihkan lampiran sampah: ${err.message}` });
  } finally {
    release();
  }
});

// POST /api/backup/integrity/reconstruct - Reconstruct missing DB records from sidecar JSON files
app.post('/api/backup/integrity/reconstruct', async (req, res) => {
  const release = await dbMutex.acquire();
  try {
    const db = await readDb();
    
    const getAllMetaFilesRecursive = (dirPath: string): string[] => {
      let results: string[] = [];
      if (!fs.existsSync(dirPath)) return results;
      const list = fs.readdirSync(dirPath);
      list.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllMetaFilesRecursive(filePath));
        } else if (file.toLowerCase().endsWith('.pdf.json')) {
          results.push(filePath);
        }
      });
      return results;
    };

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const allMetaFiles = getAllMetaFilesRecursive(uploadsDir);

    let restoredCount = 0;
    let skippedCount = 0;

    for (const metaFilePath of allMetaFiles) {
      try {
        const fileContent = fs.readFileSync(metaFilePath, 'utf-8');
        const mailRecord = JSON.parse(fileContent);

        if (mailRecord && mailRecord.id && mailRecord.metadata) {
          const exists = db.mails.some((m: any) => m.id === mailRecord.id);
          if (!exists) {
            const pdfFullPath = path.join(process.cwd(), mailRecord.pdfPath);
            if (fs.existsSync(pdfFullPath)) {
              await pool.query(
                'INSERT INTO mails (id, metadata, pdf_path, version_id, created_at) VALUES ($1, $2, $3, $4, $5)',
                [mailRecord.id, { ...mailRecord, metadata: undefined }, mailRecord.pdfPath, mailRecord.versionId || 1, mailRecord.createdAt]
              );
              db.mails.push(mailRecord);
              restoredCount++;
            } else {
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        }
      } catch (parseErr: any) {
        logMessage('WARN', `Failed parsing meta file ${metaFilePath}: ${parseErr.message}`);
      }
    }

    if (restoredCount > 0) {
      writeDb(db); // Sync JSON
      logMessage('INFO', `Database reconstructed: Restored ${restoredCount} mails from sidecar metadata files.`);
    }

    res.json({
      success: true,
      restoredCount,
      skippedCount,
      message: `Berhasil merekonstruksi ${restoredCount} surat dari file deskriptor fisik PDF. ${skippedCount} file dilewati (sudah ada di database atau PDF tidak ada).`
    });
  } catch (err: any) {
    logMessage('ERROR', `Reconstruct DB failed: ${err.message}`);
    res.status(500).json({ message: `Gagal merekonstruksi database dari metadata: ${err.message}` });
  } finally {
    release();
  }
});

// Fuzzy search helpers for server-side
function serverFuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  if (!query) return { matches: true, score: 0 };
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  if (t === q) {
    return { matches: true, score: 1000 };
  }

  const idx = t.indexOf(q);
  if (idx !== -1) {
    return { matches: true, score: 500 - idx };
  }

  let qIdx = 0;
  let tIdx = 0;
  let score = 0;
  let consecutiveCount = 0;

  while (qIdx < q.length && tIdx < t.length) {
    if (q[qIdx] === t[tIdx]) {
      consecutiveCount++;
      score += 10 + (consecutiveCount * 12) - (tIdx * 0.4);
      qIdx++;
    } else {
      consecutiveCount = 0;
    }
    tIdx++;
  }

  const matches = qIdx === q.length;
  return { matches, score: matches ? Math.max(1, score) : 0 };
}

function serverGetMailSearchScore(mail: any, query: string): { matches: boolean; score: number } {
  if (!query) return { matches: true, score: 0 };

  const scores: number[] = [];

  const typeRes = serverFuzzyMatch(mail.type || '', query);
  if (typeRes.matches) {
    scores.push(typeRes.score * 1.5);
  }

  if (mail.metadata) {
    for (const [key, value] of Object.entries(mail.metadata)) {
      if (!value) continue;
      const valStr = String(value);
      const res = serverFuzzyMatch(valStr, query);
      if (res.matches) {
        const isCriticalField = ['nomorSurat', 'perihal', 'pengirim', 'penerima'].includes(key);
        scores.push(res.score * (isCriticalField ? 1.3 : 1.0));
      }
    }
  }

  if (mail.createdByName) {
    const res = serverFuzzyMatch(mail.createdByName, query);
    if (res.matches) {
      scores.push(res.score * 1.2);
    }
  }

  if (scores.length === 0) {
    return { matches: false, score: 0 };
  }

  return { matches: true, score: Math.max(...scores) };
}

// 5. Mail Records (CRUD)
app.get('/api/mails', async (req, res) => {
  const db = await readDb();
  let mails = [...db.mails];

  // 1. Global search (fuzzy match with scoring)
  const search = req.query.search as string;
  let mailScores: Record<string, number> = {};
  if (search) {
    mails = mails.filter((mail: any) => {
      const res = serverGetMailSearchScore(mail, search);
      if (res.matches) {
        mailScores[mail.id] = res.score;
        return true;
      }
      return false;
    });
  }

  // 2. Column-specific filtering
  Object.keys(req.query).forEach((key) => {
    if (key !== 'search' && key !== 'sortKey' && key !== 'sortOrder' && key !== 'page' && key !== 'limit') {
      const filterVal = String(req.query[key]).toLowerCase();
      mails = mails.filter((mail: any) => {
        if (key === 'type') {
          return mail.type.toLowerCase().includes(filterVal);
        }
        const metaVal = mail.metadata?.[key];
        return metaVal && String(metaVal).toLowerCase().includes(filterVal);
      });
    }
  });

  // 3. Sort
  const sortKey = req.query.sortKey as string;
  const sortOrder = req.query.sortOrder as string || 'desc';
  if (sortKey) {
    mails.sort((a: any, b: any) => {
      let valA = sortKey === 'type' ? a.type : (a.metadata?.[sortKey] ?? '');
      let valB = sortKey === 'type' ? b.type : (b.metadata?.[sortKey] ?? '');
      
      const strA = String(valA);
      const strB = String(valB);
      
      const comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  } else {
    mails.sort((a: any, b: any) => {
      // If search is active, sort by relevance score descending
      if (search) {
        const scoreA = mailScores[a.id] || 0;
        const scoreB = mailScores[b.id] || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
      }
      // Default sorting by standard receipt date or created date
      const dateA = a.metadata?.tanggalTerima || a.createdAt;
      const dateB = b.metadata?.tanggalTerima || b.createdAt;
      
      if (dateA < dateB) return 1;
      if (dateA > dateB) return -1;

      // If dates are equal, sort by noUrut (natural sorting) descending (newest/highest first)
      const valA = String(a.metadata?.noUrut || a.metadata?.nourut || '');
      const valB = String(b.metadata?.noUrut || b.metadata?.nourut || '');
      if (valA || valB) {
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        if (comp !== 0) return -comp; // descending: newest/highest first
      }

      // If noUrut is same, compare createdAt descending
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;

      return 0;
    });
  }

  // 4. Paginate if requested
  const page = req.query.page ? parseInt(req.query.page as string, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;

  if (page !== null && limit !== null && !isNaN(page) && !isNaN(limit)) {
    const total = mails.length;
    const startIndex = (page - 1) * limit;
    const paginatedMails = mails.slice(startIndex, startIndex + limit);
    res.json({
      data: paginatedMails,
      total,
      page,
      limit
    });
  } else {
    res.json(mails);
  }
});

app.post('/api/mails', async (req, res) => {
  const { type, metadata, pdfData, pdfName } = req.body;
  const db = await readDb();

  let pdfPath = '';
  if (pdfData && pdfName) {
    try {
      const buffer = Buffer.from(pdfData, 'base64');
      
      // Structure storage: data/uploads/[Tahun]/[Bulan]/[Hari]/[Nama_Berkas].pdf
      const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
      const [year, month, day] = tTerima.split('-');
      
      const relativeUploadDir = path.join('data', 'uploads', year || 'unknown', month || 'unknown', day || 'unknown');
      const uploadDir = path.join(process.cwd(), relativeUploadDir);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const formattedName = getFormattedPdfName(db, metadata, pdfName);
      
      const finalPdfPath = path.join(uploadDir, formattedName);
      fs.writeFileSync(finalPdfPath, buffer);
      
      // Keep relative path for frontend serving
      pdfPath = path.join(relativeUploadDir, formattedName).replace(/\\/g, '/');
      logMessage('INFO', `File PDF uploaded and renamed: ${pdfPath}`);
    } catch (err: any) {
      logMessage('ERROR', `Failed saving PDF file: ${err.message}`);
    }
  }

  const createdBy = req.headers['x-username'] ? String(req.headers['x-username']) : 'operator';
  const createdByName = req.headers['x-user-name'] ? String(req.headers['x-user-name']) : 'Operator';

  const newMail = {
    id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    pdfPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versionId: 1,
    metadata,
    createdBy,
    createdByName,
    updatedBy: createdBy,
    updatedByName: createdByName
  };

  try {
    await pool.query(
      'INSERT INTO mails (id, metadata, pdf_path, version_id) VALUES ($1, $2, $3, $4)',
      [newMail.id, { ...newMail, metadata: undefined }, newMail.pdfPath, newMail.versionId]
    );
    writeDb(db); // Sync JSON
    saveSidecarMeta(newMail);
    logMessage('INFO', `Mail record created: ${newMail.id}`);
    res.json({ success: true, mail: newMail });
  } catch (err: any) {
    logMessage('ERROR', `Failed creating mail record in PG: ${err.message}`);
    res.status(500).json({ message: 'Gagal menyimpan surat.' });
  }
});

app.put('/api/mails/:id', async (req, res) => {
  const { id } = req.params;
  const { type, metadata, pdfData, pdfName, versionId, deletePdf } = req.body;
  const db = await readDb();

  const index = db.mails.findIndex((m: any) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Surat tidak ditemukan.' });
  }

  const existingMail = db.mails[index];

  // Optimistic Locking Check
  if (existingMail.versionId !== versionId) {
    logMessage('WARN', `Collision detected while editing mail ${id}. Expected version: ${existingMail.versionId}, Got: ${versionId}`);
    return res.status(409).json({ 
      collision: true, 
      message: 'Perubahan gagal disimpan karena surat ini baru saja diperbarui oleh pengguna lain. Silakan muat ulang halaman.' 
    });
  }

  let pdfPath = existingMail.pdfPath;
  if (deletePdf) {
    if (pdfPath) {
      try {
        const fullPath = path.join(process.cwd(), pdfPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          logMessage('INFO', `Deleted physical PDF file: ${pdfPath}`);
        }
        deleteSidecarMeta(pdfPath);
      } catch (err: any) {
        logMessage('ERROR', `Failed deleting physical PDF file: ${err.message}`);
      }
    }
    pdfPath = '';
  } else if (pdfData && pdfName) {
    try {
      const buffer = Buffer.from(pdfData, 'base64');
      const tTerima = metadata.tanggalTerima || new Date().toISOString().split('T')[0];
      const [year, month, day] = tTerima.split('-');
      
      const relativeUploadDir = path.join('data', 'uploads', year || 'unknown', month || 'unknown', day || 'unknown');
      const uploadDir = path.join(process.cwd(), relativeUploadDir);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const formattedName = getFormattedPdfName(db, metadata, pdfName);
      
      const finalPdfPath = path.join(uploadDir, formattedName);
      fs.writeFileSync(finalPdfPath, buffer);
      
      const newRelativePath = path.join(relativeUploadDir, formattedName).replace(/\\/g, '/');
      if (existingMail.pdfPath && existingMail.pdfPath !== newRelativePath) {
        try {
          const oldFullPath = path.join(process.cwd(), existingMail.pdfPath);
          if (fs.existsSync(oldFullPath)) {
            fs.unlinkSync(oldFullPath);
          }
          deleteSidecarMeta(existingMail.pdfPath);
        } catch (delErr: any) {
          logMessage('WARN', `Failed to clean old file during replacement: ${delErr.message}`);
        }
      }

      pdfPath = newRelativePath;
      logMessage('INFO', `Updated PDF for mail: ${id}`);
    } catch (err: any) {
      logMessage('ERROR', `Failed replacing PDF file: ${err.message}`);
    }
  }

  const updatedBy = req.headers['x-username'] ? String(req.headers['x-username']) : 'operator';
  const updatedByName = req.headers['x-user-name'] ? String(req.headers['x-user-name']) : 'Operator';

  existingMail.type = type;
  existingMail.metadata = metadata;
  if (!deletePdf && !pdfData && pdfPath) {
    pdfPath = renameMailPdfFile(db, existingMail);
  }
  existingMail.pdfPath = pdfPath;
  existingMail.updatedAt = new Date().toISOString();
  existingMail.versionId = (existingMail.versionId || 1) + 1;
  existingMail.updatedBy = updatedBy;
  existingMail.updatedByName = updatedByName;

  if (!existingMail.createdBy) {
    existingMail.createdBy = updatedBy;
    existingMail.createdByName = updatedByName;
  }

  try {
    await pool.query(
      'UPDATE mails SET metadata = $1, pdf_path = $2, version_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [{ ...existingMail, metadata: undefined }, existingMail.pdfPath, existingMail.versionId, id]
    );
    writeDb(db);
    saveSidecarMeta(existingMail);
    logMessage('INFO', `Mail record updated: ${id}, new version: ${existingMail.versionId}`);
    res.json({ success: true, mail: existingMail });
  } catch (err: any) {
    logMessage('ERROR', `Failed updating mail record in PG: ${err.message}`);
    res.status(500).json({ message: 'Gagal memperbarui surat.' });
  }
});

app.delete('/api/mails/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDb();

  const mail = db.mails.find((m: any) => m.id === id);
  if (!mail) {
    return res.status(404).json({ message: 'Surat tidak ditemukan.' });
  }

  // Try to clean up physical file
  if (mail.pdfPath) {
    try {
      const fullPath = path.join(process.cwd(), mail.pdfPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logMessage('INFO', `Deleted physical PDF file: ${mail.pdfPath}`);
      }
      deleteSidecarMeta(mail.pdfPath);
    } catch (err: any) {
      logMessage('ERROR', `Failed deleting physical file: ${err.message}`);
    }
  }

  try {
    await pool.query('DELETE FROM mails WHERE id = $1', [id]);
    db.mails = db.mails.filter((m: any) => m.id !== id);
    writeDb(db);
    logMessage('INFO', `Mail record deleted: ${id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus surat.' });
  }
});

// Stream / Get PDF File
app.get('/api/files/*', (req, res) => {
  const relativePath = req.params[0];
  let fullPath = path.join(process.cwd(), 'data', relativePath);
  
  if (relativePath.startsWith('data/')) {
    fullPath = path.join(process.cwd(), relativePath);
  }
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(fullPath);
  } else {
    // Fallback: check if appending process.cwd() directly works
    const fallbackPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(fallbackPath);
    } else {
      logMessage('WARN', `File not found in files API. Tried: ${fullPath} and ${fallbackPath}`);
      res.status(404).json({ message: 'Berkas tidak ditemukan.' });
    }
  }
});

// ==========================================
// EXCEL IMPORT / EXPORT (excelize equivalent)
// ==========================================

// Export Data to Excel
app.get('/api/excel/export', (req, res) => {
  try {
    const db = readDbSync();
    const columns = db.config.columns.sort((a: any, b: any) => a.order - b.order);
    
    // Create rows array with formatted keys
    const startNo = db.config.startNo || 1;
    const dataRows = db.mails.map((mail: any, index: number) => {
      const row: any = {
        'No': index + startNo,
      };
      
      columns.forEach((col: any) => {
        row[col.label] = mail.metadata?.[col.key] || '';
      });
      
      row['Tanggal Upload'] = (mail.createdAt && String(mail.createdAt).includes('T')) ? String(mail.createdAt).split('T')[0] : (mail.createdAt ? String(mail.createdAt) : '');
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataRows);
    
    // Auto-fit column widths
    const maxLens = dataRows.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, index) => {
        const len = Math.max(String(key).length, String(row[key] || '').length);
        acc[index] = Math.max(acc[index] || 10, len);
      });
      return acc;
    }, []);
    ws['!cols'] = maxLens.map((len: number) => ({ wch: len + 3 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Agenda Surat');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Agenda_Persuratan_Export.xlsx');
    res.send(buffer);
    logMessage('INFO', 'Data exported to Excel successfully');
  } catch (err: any) {
    logMessage('ERROR', `Excel export failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengekspor berkas Excel.' });
  }
});

// Download Dynamic Blank Template
app.get('/api/excel/template', (req, res) => {
  try {
    const db = readDbSync();
    const columns = db.config.columns.sort((a: any, b: any) => a.order - b.order);

    // Dynamic Headers
    const headers: string[] = [];
    columns.forEach((col: any) => {
      headers.push(`${col.label} (${col.type === 'date' ? 'YYYY-MM-DD' : col.type === 'number' ? 'Angka' : 'Teks'})${col.required ? ' *' : ''}`);
    });

    const exampleRow: any = [];
    columns.forEach((col: any) => {
      if (col.type === 'date') exampleRow.push('2026-07-02');
      else if (col.type === 'number') exampleRow.push('100');
      else exampleRow.push('Contoh Data');
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      exampleRow,
    ]);

    // Format headers column widths
    ws['!cols'] = headers.map((h) => ({ wch: h.length + 5 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Template Agenda');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Template_Agenda_Surat.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal membuat templat Excel.' });
  }
});

// Import Excel with row validation
app.post('/api/excel/import', express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }), (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ message: 'Berkas Excel kosong atau tidak terkirim.' });
    }

    const db = readDbSync();
    const columns = db.config.columns.sort((a: any, b: any) => a.order - b.order);

    let workbook;
    try {
      workbook = XLSX.read(req.body, { type: 'buffer' });
    } catch (parseErr: any) {
      logMessage('WARN', `Excel parsing failed: ${parseErr.message}`);
      return res.status(400).json({ message: 'Format berkas tidak valid. Harap unggah berkas Excel (.xlsx) yang benar.' });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length < 2) {
      return res.status(400).json({ message: 'Berkas Excel kosong atau tidak memiliki baris data agenda.' });
    }

    const headers: string[] = rows[0];
    const dataRows = rows.slice(1);
    
    const colAliases: Record<string, string[]> = {
      nourut: ['no urut', 'nomor urut', 'no urut agenda', 'nomor urut agenda', 'no agenda', 'nomor agenda', 'agenda', 'nourut', 'no'],
      nosurat: ['no surat', 'nomor surat', 'nomer surat', 'nosurat', 'nomorsurat'],
      nomorsurat: ['no surat', 'nomor surat', 'nomer surat', 'nosurat', 'nomorsurat'],
      tanggalsurat: ['tgl surat', 'tanggal surat', 'tgl kirim', 'tanggal kirim', 'tanggalsurat'],
      tanggalterima: ['tgl terima', 'tanggal terima', 'tgl masuk', 'tanggal masuk', 'tanggalterima'],
      pengirim: ['pengirim', 'dari', 'asal', 'asal surat', 'suratdari', 'surat dari'],
      suratdari: ['pengirim', 'dari', 'asal', 'asal surat', 'suratdari', 'surat dari'],
      perihal: ['perihal', 'isi', 'isi ringkas', 'hal', 'perihal isi ringkas', 'perihal isi', 'subjek', 'isisurat', 'isi surat'],
      isisurat: ['perihal', 'isi', 'isi ringkas', 'hal', 'perihal isi ringkas', 'perihal isi', 'subjek', 'isisurat', 'isi surat'],
      keterangan: ['keterangan', 'ket', 'catatan', 'disposisi'],
      disposisi: ['keterangan', 'ket', 'catatan', 'disposisi'],
      jenissurat: ['jenis surat', 'jenis', 'tipe', 'tipe surat', 'jenissurat'],
      kodesurat: ['kode surat', 'kode', 'klasifikasi', 'kode klasifikasi', 'kodesurat']
    };

    // Step 1: Strict Exact and Alias Matches with robust normalization
    const matchedIndices = new Set<number>();
    const colMappings = columns.map((col: any) => {
      const colKeyNorm = col.key.toLowerCase();
      const normLabel = col.label.toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, '')
        .replace(/[_\-]/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const normKey = col.key.toLowerCase()
        .replace(/[_\-]/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const aliases = colAliases[colKeyNorm] || [];

      // Find exact or alias match first
      let idx = headers.findIndex((h, hIdx) => {
        if (h === undefined || h === null) return false;
        const normH = String(h).toLowerCase()
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/[_\-]/g, ' ')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return normH === normLabel || normH === normKey || aliases.includes(normH);
      });

      // If found, mark it as matched
      if (idx !== -1) {
        matchedIndices.add(idx);
      }
      return { ...col, index: idx };
    });

    // Step 2: Loose Fallback Match for columns that still don't have a match
    colMappings.forEach((col: any) => {
      if (col.index === -1) {
        const normLabel = col.label.toLowerCase()
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/[_\-]/g, ' ')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const normKey = col.key.toLowerCase()
          .replace(/[_\-]/g, ' ')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const idx = headers.findIndex((h, hIdx) => {
          if (h === undefined || h === null || matchedIndices.has(hIdx)) return false;
          const normH = String(h).toLowerCase()
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/[_\-]/g, ' ')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Only allow substring matching if normH is longer than 3 characters (avoiding short "no" matching)
          if (normH.length > 3) {
            if (normLabel.includes(normH) || normH.includes(normLabel) || normKey.includes(normH) || normH.includes(normKey)) {
              return true;
            }
          }
          return false;
        });

        if (idx !== -1) {
          col.index = idx;
          matchedIndices.add(idx);
        }
      }
    });

    // Step 3: Absolute Last Resort for "noUrut" or "nomorUrut" if still not matched and there is a "no" or "nomor" column
    const noUrutCol = colMappings.find((col: any) => col.key === 'noUrut' || col.key === 'nomorUrut');
    if (noUrutCol && noUrutCol.index === -1) {
      const idx = headers.findIndex((h, hIdx) => {
        if (h === undefined || h === null || matchedIndices.has(hIdx)) return false;
        const normH = String(h).toLowerCase()
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/[_\-]/g, ' ')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return normH === 'no' || normH === 'nomor';
      });
      if (idx !== -1) {
        noUrutCol.index = idx;
        matchedIndices.add(idx);
      }
    }

    const errors: string[] = [];
    const validMails: any[] = [];

    const createdBy = req.headers['x-username'] ? String(req.headers['x-username']) : 'operator';
    const createdByName = req.headers['x-user-name'] ? String(req.headers['x-user-name']) : 'Operator';

    // Robust, Timezone-Safe Date parsing helper
    const parseExcelDate = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      if (val instanceof Date) {
        if (!isNaN(val.getTime())) {
          // Format as local YYYY-MM-DD instead of UTC to avoid timezone shift
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, '0');
          const day = String(val.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return null;
      }

      let dateStr = String(val).trim();
      if (!dateStr) return null;

      if (dateStr.includes('T')) {
        const parts = dateStr.split('T');
        if (/^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
          return parts[0];
        }
      }

      const matchIso = dateStr.match(/^(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})$/);
      if (matchIso) {
        const year = matchIso[1];
        const month = matchIso[2].padStart(2, '0');
        const day = matchIso[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      const matchIndo = dateStr.match(/^(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{4})$/);
      if (matchIndo) {
        const day = matchIndo[1].padStart(2, '0');
        const month = matchIndo[2].padStart(2, '0');
        const year = matchIndo[3];
        return `${year}-${month}-${day}`;
      }

      const matchIndoShort = dateStr.match(/^(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2})$/);
      if (matchIndoShort) {
        const day = matchIndoShort[1].padStart(2, '0');
        const month = matchIndoShort[2].padStart(2, '0');
        let year = matchIndoShort[3];
        year = `20${year}`;
        return `${year}-${month}-${day}`;
      }

      const serialNum = Number(dateStr);
      if (!isNaN(serialNum) && serialNum > 1000 && serialNum < 100000) {
        const date = new Date(Math.round((serialNum - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }

      const parsedTime = Date.parse(dateStr);
      if (!isNaN(parsedTime)) {
        const date = new Date(parsedTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return null;
    };

    // Robust Number parsing helper
    const parseExcelNumber = (val: any): number | null => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number') return val;
      
      const originalStr = String(val).trim();
      if (originalStr === '') return null;

      let num = Number(originalStr);
      if (!isNaN(num)) return num;

      let numStr = originalStr.replace(/[^0-9,\.\-]/g, '');
      if (numStr === '') return null;

      num = Number(numStr);
      if (!isNaN(num)) return num;

      const cleanNumStr = numStr.replace(/\./g, '').replace(/,/g, '.');
      num = Number(cleanNumStr);
      if (!isNaN(num)) return num;

      return null;
    };

    const baseTime = Date.now();
    dataRows.forEach((row, rowIndex) => {
      const lineNum = rowIndex + 2; // header is row 1
      if (!row || !Array.isArray(row)) return;

      // Filter out empty rows where all elements are undefined, null, or empty string when converted to string
      const isRowEmpty = row.every((val: any) => val === undefined || val === null || String(val).trim() === '');
      if (isRowEmpty) return;

      const metadata: Record<string, any> = {};
      let hasValidationError = false;

      for (const col of colMappings) {
        if (col.index === -1) {
          if (col.required) {
            errors.push(`Baris ${lineNum}: Kolom "${col.label}" tidak ditemukan di file Excel.`);
            hasValidationError = true;
          }
          continue;
        }

        const rawCellVal = row[col.index];
        if (rawCellVal === undefined || rawCellVal === null) {
          if (col.required) {
            errors.push(`Baris ${lineNum}: Kolom "${col.label}" wajib diisi.`);
            hasValidationError = true;
          }
          metadata[col.key] = '';
          continue;
        }

        const cellStr = String(rawCellVal).trim();
        if (col.required && cellStr === '') {
          errors.push(`Baris ${lineNum}: Kolom "${col.label}" tidak boleh kosong.`);
          hasValidationError = true;
          continue;
        }

        // Type validations
        if (cellStr !== '') {
          if (col.type === 'number') {
            const num = parseExcelNumber(rawCellVal);
            if (num === null) {
              errors.push(`Baris ${lineNum}: Kolom "${col.label}" harus diisi angka. Menemukan: ${cellStr}`);
              hasValidationError = true;
            } else {
              metadata[col.key] = num;
            }
          } else if (col.type === 'date') {
            const dateStr = parseExcelDate(rawCellVal);
            if (dateStr === null) {
              errors.push(`Baris ${lineNum}: Format kolom "${col.label}" harus YYYY-MM-DD atau format tanggal valid lainnya. Menemukan: ${cellStr}`);
              hasValidationError = true;
            } else {
              metadata[col.key] = dateStr;
            }
          } else {
            metadata[col.key] = cellStr;
          }
        } else {
          metadata[col.key] = '';
        }
      }

      if (!hasValidationError) {
        const rowTime = new Date(baseTime + rowIndex).toISOString();
        validMails.push({
          id: `mail_${baseTime + rowIndex}_import_${Math.random().toString(36).substr(2, 5)}`,
          type: 'Masuk',
          pdfPath: '', // no uploaded file via excel import
          createdAt: rowTime,
          updatedAt: rowTime,
          versionId: 1,
          metadata,
          createdBy,
          createdByName,
          updatedBy: createdBy,
          updatedByName: createdByName
        });
      }
    });

    if (errors.length > 0) {
      logMessage('WARN', `Excel import found ${errors.length} errors`);
      return res.status(400).json({ success: false, errors });
    }

    // Identify unique key / identifier column dynamically
    let uniqueKey = '';
    const possibleUniqueKeys = ['nomorSurat', 'nosurat', 'no_surat', 'noSurat', 'noAgenda', 'no_agenda', 'noUrut', 'nourut', 'no_urut'];
    const colKeys = columns.map((col: any) => col.key);
    
    uniqueKey = colKeys.find((k: string) => possibleUniqueKeys.includes(k)) || '';
    if (!uniqueKey) {
      uniqueKey = colKeys.find((k: string) => {
        const lowerK = k.toLowerCase();
        return lowerK.includes('nomor') || lowerK.includes('nosurat') || lowerK.includes('no_') || lowerK.includes('nourut');
      }) || '';
    }
    if (!uniqueKey && colKeys.length > 0) {
      uniqueKey = colKeys[0];
    }

    const uniqueCol = columns.find((c: any) => c.key === uniqueKey);
    const uniqueLabel = uniqueCol ? uniqueCol.label : 'ID / Nomor';

    // Check for duplicates
    const mode = String(req.query.mode || 'check');
    const duplicates: any[] = [];
    const duplicateMap = new Map<string, any>(); // maps uniqueValue -> existingMail

    if (uniqueKey) {
      db.mails.forEach((existingMail: any) => {
        const val = existingMail.metadata?.[uniqueKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          duplicateMap.set(String(val).trim().toLowerCase(), existingMail);
        }
      });

      validMails.forEach((newMail: any, idx: number) => {
        const newVal = newMail.metadata?.[uniqueKey];
        if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
          const keyStr = String(newVal).trim().toLowerCase();
          if (duplicateMap.has(keyStr)) {
            duplicates.push({
              line: idx + 2, // header is row 1
              uniqueValue: String(newVal).trim(),
              uniqueLabel,
              newData: newMail.metadata,
              existingData: duplicateMap.get(keyStr).metadata
            });
          }
        }
      });
    }

    if (mode === 'check' && duplicates.length > 0) {
      logMessage('INFO', `Excel import found ${duplicates.length} duplicate records.`);
      return res.json({
        success: false,
        duplicatesFound: true,
        duplicates,
        message: `Ditemukan ${duplicates.length} data agenda dengan ${uniqueLabel} yang sama di dalam database.`
      });
    }

    let finalMailsToSave = [...db.mails];
    let importedCount = 0;
    let skippedCount = 0;
    let overwrittenCount = 0;

    if (mode === 'skip') {
      const duplicateVals = new Set(duplicates.map(d => d.uniqueValue.toLowerCase()));
      validMails.forEach((newMail: any) => {
        const newVal = newMail.metadata?.[uniqueKey];
        const keyStr = newVal ? String(newVal).trim().toLowerCase() : '';
        if (keyStr && duplicateVals.has(keyStr)) {
          skippedCount++;
        } else {
          finalMailsToSave.push(newMail);
          importedCount++;
        }
      });
    } else if (mode === 'overwrite') {
      const duplicateValsMap = new Map<string, any>();
      validMails.forEach((newMail: any) => {
        const newVal = newMail.metadata?.[uniqueKey];
        if (newVal) {
          duplicateValsMap.set(String(newVal).trim().toLowerCase(), newMail);
        }
      });

      // Update existing ones
      finalMailsToSave = finalMailsToSave.map((existingMail: any) => {
        const val = existingMail.metadata?.[uniqueKey];
        const keyStr = val ? String(val).trim().toLowerCase() : '';
        if (keyStr && duplicateValsMap.has(keyStr)) {
          const newMail = duplicateValsMap.get(keyStr);
          overwrittenCount++;
          return {
            ...existingMail,
            metadata: {
              ...existingMail.metadata,
              ...newMail.metadata
            },
            updatedAt: new Date().toISOString(),
            updatedBy: createdBy,
            updatedByName: createdByName
          };
        }
        return existingMail;
      });

      // Add new ones
      const existingKeys = new Set();
      db.mails.forEach((existingMail: any) => {
        const val = existingMail.metadata?.[uniqueKey];
        if (val) {
          existingKeys.add(String(val).trim().toLowerCase());
        }
      });

      validMails.forEach((newMail: any) => {
        const newVal = newMail.metadata?.[uniqueKey];
        const keyStr = newVal ? String(newVal).trim().toLowerCase() : '';
        if (!keyStr || !existingKeys.has(keyStr)) {
          finalMailsToSave.push(newMail);
          importedCount++;
        }
      });
    } else {
      // Normal import (no duplicates or mode is check but 0 duplicates)
      finalMailsToSave.push(...validMails);
      importedCount = validMails.length;
    }

    // Write valid records
    db.mails = finalMailsToSave;
    writeDb(db);
    logMessage('INFO', `Successfully imported Excel. Mode: ${mode}, Imported: ${importedCount}, Skipped: ${skippedCount}, Overwritten: ${overwrittenCount}`);
    res.json({
      success: true,
      count: importedCount,
      skippedCount,
      overwrittenCount,
      message: mode === 'skip'
        ? `Berhasil mengimpor ${importedCount} data baru. ${skippedCount} data duplikat dilewati.`
        : mode === 'overwrite'
        ? `Berhasil mengimpor ${importedCount} data baru dan memperbarui ${overwrittenCount} data duplikat.`
        : `Berhasil mengimpor ${importedCount} data agenda surat.`
    });
  } catch (err: any) {
    logMessage('ERROR', `Excel import failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengimpor data dari Excel.' });
  }
});

// ==========================================
// PDF MANIPULATIONS (pdfcpu & jspdf)
// ==========================================

// PDF Merge Endpoint
app.post('/api/pdf/merge', async (req, res) => {
  try {
    const { pdfFiles } = req.body; // array of base64 strings
    if (!pdfFiles || pdfFiles.length < 2) {
      return res.status(400).json({ message: 'Minimal sediakan 2 berkas PDF untuk digabungkan.' });
    }

    const mergedPdf = await PDFDocument.create();
    for (const base64Str of pdfFiles) {
      const pdfBytes = Buffer.from(base64Str, 'base64');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(mergedBytes));
    logMessage('INFO', `Successfully merged ${pdfFiles.length} PDF files`);
  } catch (err: any) {
    logMessage('ERROR', `PDF Merge failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal menggabungkan berkas-berkas PDF.' });
  }
});

// PDF Split Endpoint
app.post('/api/pdf/split', async (req, res) => {
  try {
    const { pdfData, range } = req.body; // base64 pdf and range e.g. "1-2"
    if (!pdfData || !range) {
      return res.status(400).json({ message: 'Mohon upload berkas PDF dan isi rentang halaman.' });
    }

    const pdfBytes = Buffer.from(pdfData, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // Parse page range: e.g., "1-2" -> [0, 1]
    const pagesToExtract: number[] = [];
    const parts = range.split(',');

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
          return res.status(400).json({ message: `Rentang halaman "${part}" tidak valid. Jumlah total halaman: ${pageCount}` });
        }
        for (let i = start; i <= end; i++) {
          pagesToExtract.push(i - 1);
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1 || page > pageCount) {
          return res.status(400).json({ message: `Nomor halaman "${part}" tidak valid. Jumlah total halaman: ${pageCount}` });
        }
        pagesToExtract.push(page - 1);
      }
    }

    const splitPdf = await PDFDocument.create();
    const copiedPages = await splitPdf.copyPages(pdfDoc, pagesToExtract);
    copiedPages.forEach((page) => splitPdf.addPage(page));

    const splitBytes = await splitPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(splitBytes));
    logMessage('INFO', `Successfully split PDF using range: ${range}`);
  } catch (err: any) {
    logMessage('ERROR', `PDF Split failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal memotong halaman PDF.' });
  }
});

// PDF Compression Endpoint (genuine compression using Ghostscript with fallback)
app.post('/api/pdf/compress', async (req, res) => {
  const tempInputPath = path.join(os.tmpdir(), `compress_in_${Date.now()}_${Math.floor(Math.random() * 100000)}.pdf`);
  const tempOutputPath = path.join(os.tmpdir(), `compress_out_${Date.now()}_${Math.floor(Math.random() * 100000)}.pdf`);

  try {
    const { pdfData, level } = req.body; // level: 'low' | 'medium' | 'high'
    if (!pdfData) {
      return res.status(400).json({ message: 'Sediakan file PDF untuk dikompres.' });
    }

    const pdfBytes = Buffer.from(pdfData, 'base64');
    
    // Choose appropriate Ghostscript compression profile:
    // - /screen = lowest quality, smallest file size (72 dpi images) - for 'high' compression level
    // - /ebook = medium quality, moderate compression (150 dpi images) - for 'medium' compression level
    // - /printer = high quality, low compression (300 dpi images) - for 'low' compression level
    let gsSetting = '/ebook';
    if (level === 'high') {
      gsSetting = '/screen';
    } else if (level === 'low') {
      gsSetting = '/printer';
    }

    // Write base64 bytes to a temporary file
    fs.writeFileSync(tempInputPath, pdfBytes);

    // Build the Ghostscript command
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutputPath}" "${tempInputPath}"`;
    
    let compressedBytes: Buffer;
    try {
      await execPromise(gsCommand);
      if (fs.existsSync(tempOutputPath) && fs.statSync(tempOutputPath).size > 0) {
        compressedBytes = fs.readFileSync(tempOutputPath);
        logMessage('INFO', `PDF Compressed successfully using Ghostscript setting ${gsSetting}`);
      } else {
        throw new Error('Ghostscript produced empty or missing file');
      }
    } catch (gsErr: any) {
      logMessage('WARN', `Ghostscript compression failed: ${gsErr.message}. Falling back to standard pdf-lib save.`);
      // Fallback
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfLibBytes = await pdfDoc.save({ useObjectStreams: true });
      compressedBytes = Buffer.from(pdfLibBytes);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.send(compressedBytes);
  } catch (err: any) {
    logMessage('ERROR', `PDF Compress endpoint failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal mengompres PDF.' });
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanUpErr) {
      // Ignore cleanup failures
    }
  }
});

// Generate PDF Receipt (Tanda Terima)
app.post('/api/pdf/receipt', async (req, res) => {
  try {
    let { mailIds, signerLeft, signerRight } = req.body;
    const db = await readDb();
    const selectedMails = db.mails.filter((m: any) => mailIds.includes(m.id));

    if (selectedMails.length === 0) {
      return res.status(400).json({ message: 'Tidak ada surat terpilih.' });
    }

    // Automatically determine sender from the creator (inputter) of the mails if not explicitly set
    if (!signerLeft || signerLeft.trim() === '') {
      const inputters = Array.from(new Set(selectedMails.map((m: any) => m.createdByName || 'Operator'))).filter(Boolean);
      signerLeft = inputters.join(', ') || 'Operator';
    }

    let columns = db.config.columns
      .filter((col: any) => col.includeInReceipt !== false)
      .sort((a: any, b: any) => a.order - b.order);

    if (columns.length === 0) {
      columns = db.config.columns.sort((a: any, b: any) => a.order - b.order);
    }

    // Generate PDF using jsPDF
    const doc = new jsPDF();
    const title = db.config.appName || 'Agenda Persuratan Kantor';
    
    // Header
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text('TANDA TERIMA PENYERAHAN SURAT RESMI', 105, 22, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(15, 26, 195, 26);

    // Receipt Meta
    const receiptNo = `RCV-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const fullPrintDate = `${dateStr} pukul ${timeStr}`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${fullPrintDate}`, 195, 33, { align: 'right' });

    // Calculate dynamic column widths matching database columns
    const tableWidth = 180;
    const noWidth = 10;
    const remainingWidth = tableWidth - noWidth; // 170
    
    const rawWidths = columns.map((col: any) => {
      const key = col.key.toLowerCase();
      if (key.includes('perihal') || key.includes('isi')) return 45;
      if (key.includes('pengirim') || key.includes('dari')) return 30;
      if (key.includes('nosurat') || key.includes('nomor') || key.includes('no_surat')) return 25;
      if (key.includes('nourut') || key.includes('urut') || key.includes('no_urut')) return 15;
      if (key.includes('tanggal') || key.includes('tgl')) return 20;
      if (key.includes('keterangan') || key.includes('ket')) return 20;
      return 25; // default fallback
    });
    
    const sumRaw = rawWidths.reduce((sum: number, w: number) => sum + w, 0);
    const colWidths = rawWidths.map((w: number) => Math.floor((w / sumRaw) * remainingWidth));
    
    // Adjust last column to match exactly
    const sumNormalized = colWidths.reduce((sum: number, w: number) => sum + w, 0);
    if (colWidths.length > 0 && sumNormalized !== remainingWidth) {
      colWidths[colWidths.length - 1] += (remainingWidth - sumNormalized);
    }

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 37, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('No', 17, 42);

    let currentX = 15 + noWidth; // 25
    const colXPositions: number[] = [];
    columns.forEach((col: any, idx: number) => {
      colXPositions.push(currentX);
      doc.text(col.label, currentX + 2, 42);
      currentX += colWidths[idx];
    });

    // Table Content
    let currentY = 49;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    selectedMails.forEach((mail: any, index: number) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
        // redraw page header minimal
        doc.setFont('helvetica', 'bold');
        doc.text('Lanjutan Tanda Terima...', 15, currentY);
        currentY += 10;
        doc.setFont('helvetica', 'normal');
      }

      doc.text(String(index + 1), 17, currentY);

      columns.forEach((col: any, idx: number) => {
        const val = mail.metadata?.[col.key] || '-';
        const w = colWidths[idx];
        const maxChars = Math.floor(w / 1.8);
        const truncatedVal = String(val).substring(0, maxChars);
        doc.text(truncatedVal, colXPositions[idx] + 2, currentY);
      });

      // Line separator below row
      doc.setDrawColor(220, 220, 220);
      doc.line(15, currentY + 3, 195, currentY + 3);
      currentY += 8;
    });

    currentY += 4;
    if (currentY > 260) {
      doc.addPage();
      currentY = 25;
    }

    // Sleek single-row unified signature bar
    const boxWidth = 180;
    const boxHeight = 12;
    const boxX = 15;
    const boxY = currentY;

    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, boxY, boxWidth, boxHeight, 'F'); // Shaded background

    doc.setDrawColor(180, 187, 200);
    doc.setLineWidth(0.35);
    doc.rect(boxX, boxY, boxWidth, boxHeight); // Outer border

    // Middle vertical dividing line
    doc.line(boxX + boxWidth / 2, boxY, boxX + boxWidth / 2, boxY + boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(50, 60, 70);

    // Left side: Yang Menyerahkan
    doc.text(`YANG MENYERAHKAN:  ${signerLeft || '____________________'}`, boxX + 5, boxY + 7.5);

    // Right side: Yang Menerima
    doc.text(`YANG MENERIMA:  ${signerRight || '____________________'}`, boxX + (boxWidth / 2) + 5, boxY + 7.5);

    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
    logMessage('INFO', `Generated PDF receipt: ${receiptNo}`);
  } catch (err: any) {
    logMessage('ERROR', `PDF Receipt failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal menerbitkan tanda terima PDF.' });
  }
});

// ZIP Batch Download PDF
app.post('/api/pdf/batch-download', async (req, res) => {
  try {
    const { mailIds } = req.body;
    const db = await readDb();
    const selectedMails = db.mails.filter((m: any) => mailIds.includes(m.id));

    if (selectedMails.length === 0) {
      return res.status(400).json({ message: 'Tidak ada surat terpilih.' });
    }

    const zip = new JSZip();
    let fileCount = 0;

    for (const mail of selectedMails) {
      if (mail.pdfPath) {
        const fullPath = path.join(process.cwd(), mail.pdfPath);
        if (fs.existsSync(fullPath)) {
          const fileBytes = fs.readFileSync(fullPath);
          const fileName = path.basename(mail.pdfPath);
          zip.file(fileName, fileBytes);
          fileCount++;
        }
      }
    }

    if (fileCount === 0) {
      return res.status(400).json({ message: 'Surat terpilih tidak memiliki lampiran PDF fisik.' });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=Arsip_Surat_Batch.zip');
    res.send(zipBuffer);
    logMessage('INFO', `Zipped and downloaded ${fileCount} files in batch`);
  } catch (err: any) {
    logMessage('ERROR', `Zip Batch failed: ${err.message}`);
    res.status(500).json({ message: 'Gagal membuat arsip ZIP massal.' });
  }
});


// ==========================================
// STATIC SERVING & VITE MIDDLWARE
// ==========================================

async function readDb(): Promise<any> {
  if (!pgAvailable) return readDbSync();
  const client = await pool.connect();
  try {
    const configRes = await client.query('SELECT data FROM config LIMIT 1');
    const usersRes = await client.query('SELECT username, password, name, role, data FROM users');
    const mailsRes = await client.query('SELECT id, metadata, pdf_path as "pdfPath", created_at as "createdAt", updated_at as "updatedAt", version_id as "versionId" FROM mails');

    return {
      config: configRes.rows[0]?.data || defaultDb.config,
      users: usersRes.rows.map(u => ({ ...u, ...(u.data || {}) })),
      mails: mailsRes.rows.map(m => ({ ...m, metadata: m.metadata || {} }))
    };
  } catch (err: any) {
    logMessage('ERROR', `Failed to read DB from PostgreSQL: ${err.message}`);
    return readDbSync();
  } finally {
    client.release();
  }
}

let pgAvailable = true;

async function initDb() {
  let client;
  try {
    client = await pool.connect();
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    await client.query(schema);

    // Check if config exists
    const res = await client.query('SELECT count(*) FROM config');
    if (parseInt(res.rows[0].count) === 0) {
      await client.query('INSERT INTO config (data) VALUES ($1)', [defaultDb.config]);
    }

    // Check if admin user exists
    const userRes = await client.query('SELECT count(*) FROM users');
    if (parseInt(userRes.rows[0].count) === 0) {
      for (const user of defaultDb.users) {
        await client.query(
          'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
          [user.username, user.password, user.name, user.role]
        );
      }
    }
    logMessage('INFO', 'PostgreSQL Database initialized successfully');
  } catch (err: any) {
    pgAvailable = false;
    logMessage('ERROR', `Failed to initialize PostgreSQL: ${err.message}. Falling back to JSON storage.`);
  } finally {
    if (client) client.release();
  }
}

async function startServer() {
  await initDb();
  try {
    const db = await readDb();
    generateMissingSidecars(db);
  } catch (err: any) {
    logMessage('WARN', `Failed to run initial sidecar check on startup: ${err.message}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logMessage('INFO', `Server is up & listening on port ${PORT}`);
  });
}

startServer();
