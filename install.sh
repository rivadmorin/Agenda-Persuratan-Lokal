#!/bin/bash
# ==============================================================================
# Skrip Pemasangan Satu Baris (One-Line Installer) untuk Agenda Persuratan Lokal
# ==============================================================================
set -e

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}      Sistem Agenda Persuratan Lokal Installer        ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Periksa Prasyarat
echo -e "\n${BLUE}[+] Memeriksa prasyarat sistem...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js tidak ditemukan! Silakan pasang Node.js v20+ terlebih dahulu.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}[!] Peringatan: Versi Node.js Anda (${NODE_VERSION}) di bawah v20. Disarankan menggunakan v20+.${NC}"
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}[ERROR] Git tidak ditemukan! Silakan pasang Git terlebih dahulu.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm tidak ditemukan!${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Prasyarat sistem terpenuhi (Node.js $(node -v) & Git $(git --version | cut -d' ' -f3))${NC}"

# 2. Tentukan Direktori Target & Kloning Repositori
TARGET_DIR="agenda-persuratan-lokal"

if [ -d "$TARGET_DIR" ]; then
    echo -e "\n${YELLOW}[!] Direktori '${TARGET_DIR}' sudah ada. Melakukan pembaruan kode...${NC}"
    cd "$TARGET_DIR"
    git pull
else
    echo -e "\n${BLUE}[+] Mengkloning repositori dari GitHub...${NC}"
    git clone https://github.com/rivadmorin/Agenda-Persuratan-Lokal.git "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# 3. Jalankan Skrip Instalasi Resmi (Idempotent)
echo -e "\n${BLUE}[+] Menjalankan instalasi aplikasi...${NC}"
echo -e "${YELLOW}[!] Catatan: Proses ini memerlukan waktu beberapa menit untuk mengunduh semua berkas (node_modules) dan mem-build sistem. Harap tunggu dan jangan menutup terminal Anda...${NC}"
if [ -f "launchpad/deploy.sh" ]; then
    bash launchpad/deploy.sh install
    echo -e "\n${BLUE}[+] Menjalankan pemeriksaan akhir (Doctor Check)...${NC}"
    bash launchpad/deploy.sh doctor || true
else
    echo -e "${RED}[ERROR] Skrip install internal tidak ditemukan!${NC}"
    exit 1
fi

# 4. Selesai
echo -e "\n${GREEN}[✓] Pemasangan berhasil diselesaikan!${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "Untuk menjalankan server aplikasi, jalankan perintah:"
echo -e "  ${YELLOW}cd $TARGET_DIR && bash launchpad/deploy.sh start${NC}"
echo -e "\nLalu buka browser Anda di: ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}======================================================${NC}"
