#!/bin/bash

# ==============================================================================
# Script Setup: Sistem Manajemen Agenda Persuratan Digital (PostgreSQL-Only)
# Filosofi: Simple, Hemat Sumber Daya, Cepat, Stabil, Lokal, & Portable
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

show_banner() {
    clear
    echo -e "${CYAN}====================================================================${NC}"
    echo -e "${CYAN}    📨 SISTEM MANAJEMEN AGENDA PERSURATAN DIGITAL - SETUP          ${NC}"
    echo -e "${CYAN}====================================================================${NC}"
    echo -e "Filosofi: ${GREEN}Simple, Hemat Sumber Daya, Stabil, Lokal & 100% Offline${NC}"
    echo ""
}

check_docker() {
    echo -e "${YELLOW}[INFO] Memeriksa Docker...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR] Docker tidak ditemukan!${NC}"
        echo -e "Aplikasi ini membutuhkan PostgreSQL via Docker untuk stabilitas data."
        echo -e "Silakan instal Docker terlebih dahulu: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}[✓] Docker ditemukan.${NC}"
}

start_db() {
    echo -e "${BLUE}[+] Menjalankan PostgreSQL via Docker Compose...${NC}"
    if docker compose up -d; then
        echo -e "${GREEN}[✓] Database berhasil dijalankan.${NC}"
    else
        echo -e "${RED}[ERROR] Gagal menjalankan Docker Compose.${NC}"
        exit 1
    fi
}

install_app() {
    show_banner
    check_docker
    start_db
    
    echo -e "\n${BLUE}[+] Memasang dependensi (npm install)...${NC}"
    npm install
    
    echo -e "\n${BLUE}[+] Membangun aplikasi (npm run build)...${NC}"
    npm run build
    
    echo -e "\n${GREEN}====================================================================${NC}"
    echo -e "${GREEN}      🎉 SETUP SELESAI! APLIKASI SIAP DIJALANKAN.                   ${NC}"
    echo -e "===================================================================="
    echo -e "Jalankan perintah berikut untuk memulai server:"
    echo -e "👉 ${CYAN}npm run start${NC}"
    echo -e "===================================================================="
}

install_app
