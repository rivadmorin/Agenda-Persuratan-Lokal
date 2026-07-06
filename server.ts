import { db } from './src/db/index.ts';
import { config as configTable, users as usersTable, mails as mailsTable } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
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

function logMessage(level: string, message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logLine.trim());
  try {
    fs.appendFileSync(path.join(process.cwd(), 'data', 'logs', 'server.log'), logLine);
  } catch (err) {}
}

const defaultDbConfig = {
  appName: 'Sistem Agenda Persuratan',
  logoUrl: '',
  columns: [
    { id: 'noUrut', label: 'No. Urut', type: 'text', visible: true, required: true },
    { id: 'tanggalTerima', label: 'Tgl Terima', type: 'date', visible: true, required: true },
    { id: 'tanggalSurat', label: 'Tgl Surat', type: 'date', visible: true, required: true },
    { id: 'noSurat', label: 'Nomor Surat', type: 'text', visible: true, required: true },
    { id: 'suratDari', label: 'Asal Surat', type: 'text', visible: true, required: true },
    { id: 'perihal', label: 'Perihal', type: 'text', visible: true, required: true },
    { id: 'catatan', label: 'Keterangan', type: 'text', visible: true, required: false },
  ],
  namingFormat: '{noUrut}_{suratDari}_{perihal}',
  autoRenamePdf: true
};

async function readDb() {
  const configRes = await db.query.config.findFirst();
  const usersRes = await db.select({
    username: usersTable.username,
    password: usersTable.password,
    name: usersTable.name,
    role: usersTable.role
  }).from(usersTable);

  const mailsRes = await db.select({
    id: mailsTable.id,
    metadata: mailsTable.metadata,
    pdfPath: mailsTable.pdfPath,
    createdAt: mailsTable.createdAt,
    updatedAt: mailsTable.updatedAt,
    versionId: mailsTable.versionId
  }).from(mailsTable).orderBy(mailsTable.createdAt);

  return {
    config: configRes?.data || defaultDbConfig,
    users: usersRes,
    mails: mailsRes.map(m => {
      const metadata = (m.metadata as any) || {};
      return {
        ...m,
        type: metadata.type || 'Masuk',
        metadata
      };
    })
  };
}

async function renameMailPdfFile(config: any, mail: any) {
  if (!mail.pdfPath) return null;
  const oldPath = path.join(process.cwd(), 'data', mail.pdfPath.startsWith('data/') ? mail.pdfPath.substring(5) : mail.pdfPath);
  if (!fs.existsSync(oldPath)) return mail.pdfPath;

  const ext = path.extname(oldPath);
  let newName = config.namingFormat || '{noUrut}_{suratDari}_{perihal}';
  const meta = mail.metadata || {};

  newName = newName.replace(/{noUrut}/g, meta.noUrut || '000');
  newName = newName.replace(/{tanggalTerima}/g, meta.tanggalTerima || '');
  newName = newName.replace(/{tanggalSurat}/g, meta.tanggalSurat || '');
  newName = newName.replace(/{noSurat}/g, (meta.noSurat || '').replace(/[/\?%*:|\"<>]/g, '-'));
  newName = newName.replace(/{suratDari}/g, (meta.suratDari || '').replace(/[/\?%*:|\"<>]/g, '-'));
  newName = newName.replace(/{perihal}/g, (meta.perihal || '').replace(/[/\?%*:|\"<>]/g, '-'));
  newName = newName.trim().replace(/\s+/g, '_') + ext;

  const newRelPath = path.join('uploads', newName);
  const newFullPath = path.join(process.cwd(), 'data', newRelPath);

  if (oldPath !== newFullPath) {
    try {
      if (fs.existsSync(newFullPath)) {
        const timestamp = Date.now();
        const renamedRelPath = path.join('uploads', `${path.basename(newName, ext)}_${timestamp}${ext}`);
        const renamedFullPath = path.join(process.cwd(), 'data', renamedRelPath);
        fs.renameSync(oldPath, renamedFullPath);
        if (fs.existsSync(oldPath + '.json')) fs.renameSync(oldPath + '.json', renamedFullPath + '.json');
        return renamedRelPath;
      } else {
        fs.renameSync(oldPath, newFullPath);
        if (fs.existsSync(oldPath + '.json')) fs.renameSync(oldPath + '.json', newFullPath + '.json');
        return newRelPath;
      }
    } catch (err) {
      logMessage('ERROR', `Rename failed: ${err}`);
      return mail.pdfPath;
    }
  }
  return mail.pdfPath;
}

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const dbData = await readDb();
  const user = dbData.users.find((u: any) => u.username === username && u.password === password);
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false, message: 'Username atau password salah' });
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = req.body;
    await db.insert(usersTable).values(newUser);
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    await db.update(usersTable).set(req.body).where(eq(usersTable.username, req.params.username));
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.username, req.params.username));
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

// Config
app.get('/api/config', async (req, res) => {
  try {
    const configRes = await db.query.config.findFirst();
    res.json(configRes?.data || defaultDbConfig);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    await db.update(configTable).set({ data: newConfig });
    if (newConfig.autoRenamePdf !== false) {
      const mailsRes = await db.select().from(mailsTable);
      for (const m of mailsRes) {
        if (m.pdfPath) {
          const newPath = await renameMailPdfFile(newConfig, { ...m, pdfPath: m.pdfPath, metadata: (m.metadata as any) || {} });
          if (newPath !== m.pdfPath) await db.update(mailsTable).set({ pdfPath: newPath }).where(eq(mailsTable.id, m.id));
        }
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

app.post('/api/config/columns/reorder', async (req, res) => {
  const { columns } = req.body;
  try {
    const configRes = await db.query.config.findFirst();
    if (configRes) {
      const configData = configRes.data as any;
      configData.columns = columns;
      await db.update(configTable).set({ data: configData });
      logMessage('INFO', 'Columns reordered successfully');
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Config not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mails
app.get('/api/mails', async (req, res) => {
  try {
    const dbData = await readDb();
    res.json(dbData.mails);
  } catch (err) { res.status(500).send(); }
});

app.post('/api/mails', async (req, res) => {
  try {
    const mail = req.body;
    const mailId = `mail_${Date.now()}`;
    const pdfPath = mail.pdfBase64 ? await savePdf(mailId, mail.pdfBase64, req.headers) : null;

    await db.insert(mailsTable).values({
      id: mailId,
      metadata: mail.metadata || {},
      pdfPath: pdfPath,
      versionId: '1'
    });

    res.json({ success: true, id: mailId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/mails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await db.query.mails.findFirst({ where: eq(mailsTable.id, id) });
    if (!existing) return res.status(404).json({ success: false, message: 'Mail not found' });

    if (updates.versionId && existing.versionId !== updates.versionId) {
       return res.status(409).json({ success: false, collision: true, message: 'Conflict: Data has been modified by another user.' });
    }

    const nextVersion = (parseInt(existing.versionId || '1') + 1).toString();
    let pdfPath = existing.pdfPath;
    if (updates.pdfBase64) {
      pdfPath = await savePdf(id, updates.pdfBase64, req.headers);
    }

    await db.update(mailsTable).set({
      metadata: updates.metadata || existing.metadata,
      pdfPath: pdfPath,
      versionId: nextVersion,
      updatedAt: new Date()
    }).where(eq(mailsTable.id, id));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/mails/:id', async (req, res) => {
  try {
    const existing = await db.query.mails.findFirst({ where: eq(mailsTable.id, req.params.id) });
    if (existing?.pdfPath) {
      const fullPath = path.join(process.cwd(), 'data', existing.pdfPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      if (fs.existsSync(fullPath + '.json')) fs.unlinkSync(fullPath + '.json');
    }
    await db.delete(mailsTable).where(eq(mailsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).send(); }
});

async function savePdf(id: string, base64: string, headers: any) {
  const buffer = Buffer.from(base64, 'base64');
  const configRes = await db.query.config.findFirst();
  const config = configRes?.data || defaultDbConfig;

  const dummyMail = { metadata: { noUrut: 'TEMP', suratDari: 'TEMP', perihal: 'TEMP' }, pdfPath: 'uploads/temp.pdf' };
  const filename = await renameMailPdfFile(config, dummyMail); // Simplified for now
  const finalFilename = filename ? filename.replace('uploads/', '') : `mail_${id}.pdf`;

  const relPath = path.join('uploads', finalFilename);
  const fullPath = path.join(process.cwd(), 'data', relPath);
  fs.writeFileSync(fullPath, buffer);

  const sidecar = {
    originalName: headers['x-filename'] || 'uploaded.pdf',
    uploadedBy: headers['x-username'] || 'unknown',
    uploadedAt: new Date().toISOString(),
    metadata: {}
  };
  fs.writeFileSync(fullPath + '.json', JSON.stringify(sidecar, null, 2));
  return relPath;
}

// Backup & Restore
async function restoreDbFromJson(data: any) {
  return await db.transaction(async (tx) => {
    await tx.delete(mailsTable);
    await tx.delete(usersTable);
    await tx.delete(configTable);

    if (data.config) await tx.insert(configTable).values({ data: data.config });
    if (data.users && data.users.length > 0) await tx.insert(usersTable).values(data.users);
    if (data.mails && data.mails.length > 0) {
      for (const m of data.mails) {
        await tx.insert(mailsTable).values({
          id: m.id,
          metadata: m.metadata,
          pdfPath: m.pdfPath,
          versionId: m.versionId,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date()
        });
      }
    }
  });
}

// Utility Routes
app.post('/api/backup/clear', async (req, res) => {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(mailsTable);
      await tx.delete(configTable);
      await tx.delete(usersTable);
      await tx.insert(configTable).values({ data: defaultDbConfig });
      await tx.insert(usersTable).values({ username: 'admin', password: 'admin', name: 'Administrator', role: 'admin' });
    });

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
  try {
    logMessage('INFO', 'Checking database tables...');
    const configCheck = await db.select().from(configTable).limit(1);
    if (configCheck.length === 0) await db.insert(configTable).values({ data: defaultDbConfig });

    const userCheck = await db.select().from(usersTable).limit(1);
    if (userCheck.length === 0) await db.insert(usersTable).values({ username: 'admin', password: 'admin', name: 'Administrator', role: 'admin' });

    logMessage('INFO', 'PostgreSQL Ready via Drizzle');
  } catch (err: any) {
    logMessage('ERROR', `DB Init Failure: ${err.message}`);
  }
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
