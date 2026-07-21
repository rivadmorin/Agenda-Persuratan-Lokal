const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const SYMBOLS = {
  check: COLORS.green + '[✓]' + COLORS.reset,
  cross: COLORS.red + '[✗]' + COLORS.reset,
  warn: COLORS.yellow + '[!]' + COLORS.reset,
  info: COLORS.blue + '[i]' + COLORS.reset
};

const PROJECT_ROOT = path.resolve(__dirname, '..');

function printBanner() {
  console.log(`${COLORS.cyan}======================================================${COLORS.reset}`);
  console.log(`${COLORS.cyan}     🩺 DIAGNOSTIK SISTEM (DOCTOR MODE) - AGENDA      ${COLORS.reset}`);
  console.log(`${COLORS.cyan}======================================================${COLORS.reset}\n`);
}

async function runDiagnostics() {
  printBanner();
  
  let hasCriticalError = false;
  let hasWarnings = false;
  
  // 1. Check Node.js
  try {
    const nodeVer = process.version;
    const majorVer = parseInt(nodeVer.substring(1).split('.')[0]);
    if (majorVer >= 20) {
      console.log(`${SYMBOLS.check} Node.js terpasang: ${nodeVer}`);
    } else {
      console.log(`${SYMBOLS.warn} Node.js terpasang: ${nodeVer} (Disarankan v20+)`);
      hasWarnings = true;
    }
  } catch (err) {
    console.log(`${SYMBOLS.cross} Gagal memeriksa versi Node.js: ${err.message}`);
    hasCriticalError = true;
  }
  
  // 2. Check npm
  try {
    const npmVer = execSync('npm -v', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    console.log(`${SYMBOLS.check} npm terpasang: v${npmVer}`);
  } catch (err) {
    console.log(`${SYMBOLS.cross} npm tidak ditemukan! Pastikan Node.js & npm terpasang.`);
    hasCriticalError = true;
  }

  // 3. Check git
  try {
    const gitVer = execSync('git --version', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    console.log(`${SYMBOLS.check} Git terpasang: ${gitVer}`);
  } catch (err) {
    console.log(`${SYMBOLS.warn} Git tidak ditemukan! Ini mungkin mempersulit penarikan pembaruan otomatis.`);
    hasWarnings = true;
  }

  // 4. Check folder & file permissions
  const pathsToCheck = [
    { name: 'package.json', type: 'file', required: true },
    { name: 'schema.sql', type: 'file', required: true },
    { name: 'server.ts', type: 'file', required: true },
    { name: 'data', type: 'dir', required: false, createIfMissing: true },
    { name: 'data/backups', type: 'dir', required: false, createIfMissing: true },
    { name: 'dist/server.cjs', type: 'file', required: false, buildArtifact: true },
    { name: 'dist/index.html', type: 'file', required: false, buildArtifact: true }
  ];

  console.log(`\n${COLORS.cyan}[+] Memeriksa struktur file dan direktori...${COLORS.reset}`);
  
  for (const item of pathsToCheck) {
    const fullPath = path.join(PROJECT_ROOT, item.name);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      // Check writable
      try {
        fs.accessSync(fullPath, fs.constants.R_OK | fs.constants.W_OK);
        console.log(`${SYMBOLS.check} ${item.name} (${item.type === 'dir' ? 'Folder' : 'Berkas'}) - Terbaca & Dapat Ditulis`);
      } catch (err) {
        console.log(`${SYMBOLS.cross} ${item.name} - Masalah hak akses (Tidak dapat menulis/membaca)`);
        if (item.required) hasCriticalError = true;
        else hasWarnings = true;
      }
    } else {
      if (item.required) {
        console.log(`${SYMBOLS.cross} ${item.name} - Berkas krusial hilang!`);
        hasCriticalError = true;
      } else if (item.createIfMissing) {
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`${SYMBOLS.check} ${item.name} (Folder) - Berhasil dibuat dan siap ditulis`);
        } catch (err) {
          console.log(`${SYMBOLS.cross} ${item.name} - Gagal membuat folder: ${err.message}`);
          hasCriticalError = true;
        }
      } else if (item.buildArtifact) {
        console.log(`${SYMBOLS.warn} ${item.name} - Belum di-build. Anda perlu menjalankan 'npm run build' sebelum start.`);
        hasWarnings = true;
      }
    }
  }

  // 5. Check node_modules & better-sqlite3
  console.log(`\n${COLORS.cyan}[+] Memeriksa Dependensi & Node Modules...${COLORS.reset}`);
  const nodeModulesExists = fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'));
  if (!nodeModulesExists) {
    console.log(`${SYMBOLS.cross} Folder 'node_modules' tidak ditemukan! Harap jalankan 'npm install'.`);
    hasCriticalError = true;
  } else {
    console.log(`${SYMBOLS.check} Folder 'node_modules' tersedia`);
    
    // Check better-sqlite3
    try {
      const Database = require('better-sqlite3');
      console.log(`${SYMBOLS.check} Driver 'better-sqlite3' berhasil dimuat`);
      
      // Test database connection and schema
      try {
        const dbPath = path.join(PROJECT_ROOT, 'data', 'database.db');
        const db = new Database(dbPath);
        
        // Check if schema tables exist
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        const expectedTables = ['config', 'users', 'mails'];
        const missingTables = expectedTables.filter(t => !tables.includes(t));
        
        if (missingTables.length === 0) {
          console.log(`${SYMBOLS.check} Database SQLite berhasil terhubung & skema tabel lengkap`);
        } else {
          console.log(`${SYMBOLS.warn} Database terhubung tetapi skema belum diinisialisasi (tabel hilang: ${missingTables.join(', ')}).`);
          console.log(`    -> Skema akan diinisialisasi otomatis saat server berjalan.`);
          hasWarnings = true;
        }
        db.close();
      } catch (dbErr) {
        console.log(`${SYMBOLS.cross} Gagal mengakses/menulis berkas database SQLite: ${dbErr.message}`);
        hasCriticalError = true;
      }
    } catch (err) {
      console.log(`${SYMBOLS.cross} Gagal memuat driver 'better-sqlite3'.`);
      console.log(`    Penyebab: Module belum terpasang atau ada ketidakcocokan arsitektur biner (C++ addon).`);
      console.log(`    Solusi: Jalankan 'npm install' atau bangun ulang modul menggunakan 'npm rebuild better-sqlite3'.`);
      hasCriticalError = true;
    }
  }

  // 6. Check Port 3000
  console.log(`\n${COLORS.cyan}[+] Memeriksa ketersediaan port 3000...${COLORS.reset}`);
  const portInUse = await new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(3000);
  });

  if (portInUse) {
    console.log(`${SYMBOLS.warn} Port 3000 sedang digunakan oleh aplikasi lain!`);
    console.log(`    -> Pastikan Anda menghentikan instansi server sebelumnya atau aplikasi lain di port 3000.`);
    hasWarnings = true;
  } else {
    console.log(`${SYMBOLS.check} Port 3000 tersedia untuk digunakan`);
  }

  // Final Summary
  console.log(`\n${COLORS.cyan}======================================================${COLORS.reset}`);
  if (hasCriticalError) {
    console.log(`${COLORS.red}🔴 DIAGNOSTIK SELESAI: Ditemukan kesalahan kritis!${COLORS.reset}`);
    console.log(`${COLORS.white}Harap perbaiki error bertanda ${SYMBOLS.cross} di atas sebelum menjalankan server.${COLORS.reset}`);
    console.log(`${COLORS.cyan}======================================================${COLORS.reset}`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${COLORS.yellow}🟡 DIAGNOSTIK SELESAI: Sistem dapat berjalan, dengan catatan.${COLORS.reset}`);
    console.log(`${COLORS.white}Perhatikan peringatan bertanda ${SYMBOLS.warn} di atas jika menemui kendala.${COLORS.reset}`);
    console.log(`${COLORS.cyan}======================================================${COLORS.reset}`);
    process.exit(0);
  } else {
    console.log(`${COLORS.green}🟢 DIAGNOSTIK SELESAI: Semua sistem dalam kondisi prima!${COLORS.reset}`);
    console.log(`${COLORS.white}Sistem siap dijalankan tanpa ada masalah.${COLORS.reset}`);
    console.log(`${COLORS.cyan}======================================================${COLORS.reset}`);
    process.exit(0);
  }
}

runDiagnostics();
