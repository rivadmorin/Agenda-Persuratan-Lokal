#!/bin/bash

# ==============================================================================
# Script Pengemasan Offline (Linux): Membuat Bundle Agenda Persuratan Lokal
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_DIR" || exit 1

echo -e "${BLUE}[+] Menyiapkan build produksi terbaru...${NC}"
npm run build || { echo -e "${RED}[ERROR] Gagal melakukan build produksi.${NC}"; exit 1; }

RELEASE_DIR="release"
TEMP_DIR="release/agenda-persuratan-lokal"

# Bersihkan rilis lama
rm -rf "$RELEASE_DIR"
mkdir -p "$TEMP_DIR"

echo -e "${BLUE}[+] Menyalin berkas operasional ke folder sementara...${NC}"
cp -r dist "$TEMP_DIR/"
cp -r node_modules "$TEMP_DIR/"
cp -r launchpad "$TEMP_DIR/"
cp schema.sql "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Buat folder data kosong agar database diinisialisasi bersih di sisi klien
mkdir -p "$TEMP_DIR/data"

# Hapus berkas logs atau PID jika ada di dalam folder launchpad salinan
rm -f "$TEMP_DIR/launchpad/server.log" "$TEMP_DIR/launchpad/.server.pid"

echo -e "${BLUE}[+] Membuat berkas ZIP agenda-persuratan-linux-x64.zip...${NC}"
cd release || exit 1
zip -r agenda-persuratan-linux-x64.zip agenda-persuratan-lokal/* > /dev/null

echo -e "${BLUE}[+] Membersihkan berkas sementara...${NC}"
cd "$PROJECT_DIR" || exit 1
rm -rf "$TEMP_DIR"

echo -e "${GREEN}[✓] Paket offline berhasil dibuat di: release/agenda-persuratan-linux-x64.zip${NC}"
