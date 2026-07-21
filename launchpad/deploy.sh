#!/bin/bash

# ==============================================================================
# Script Setup: Sistem Manajemen Agenda Persuratan Digital (SQLite Offline Mode)
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

show_banner() {
    clear
    echo -e "${CYAN}====================================================================${NC}"
    echo -e "${CYAN}    🚀 LAUNCHPAD: Persuratan Digital Orchestrator (SQLite)        ${NC}"
    echo -e "${CYAN}====================================================================${NC}"
    echo ""
}

show_help() {
    show_banner
    echo -e "Usage: ./launchpad/deploy.sh [command]"
    echo -e "Commands:"
    echo -e "  ${GREEN}check-prereqs${NC} : Verifies system dependencies (Node, npm)"
    echo -e "  ${GREEN}doctor${NC}        : Runs deep system diagnostics and health checks"
    echo -e "  ${GREEN}install${NC}       : Installs dependencies and builds the application"
    echo -e "  ${GREEN}start${NC}         : Starts the Node.js server with SQLite"
    echo -e "  ${GREEN}stop${NC}          : Stops the Node.js server"
    echo -e "  ${GREEN}uninstall${NC}     : Removes node_modules, build artifacts, and stops server"
    echo -e "  ${GREEN}help${NC}          : Displays this help menu"
    echo ""
}

check_prereqs() {
    echo -e "${BLUE}[+] Checking prerequisites...${NC}"

    # Check Node
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js is not installed.${NC}"
        return 1
    fi
    echo -e "${GREEN}[✓] Node.js found: $(node -v)${NC}"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR] npm is not installed.${NC}"
        return 1
    fi
    echo -e "${GREEN}[✓] npm found: $(npm -v)${NC}"
    return 0
}

run_doctor() {
    # Check Node first before executing doctor.cjs
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js tidak terpasang! Silakan pasang Node.js v20+ terlebih dahulu.${NC}"
        return 1
    fi
    if [ -f "$PROJECT_DIR/launchpad/doctor.cjs" ]; then
        node "$PROJECT_DIR/launchpad/doctor.cjs"
    else
        echo -e "${RED}[ERROR] File diagnostik launchpad/doctor.cjs tidak ditemukan!${NC}"
        return 1
    fi
}

execute_idempotent_install() {
    check_prereqs || return 1
    echo -e "\n${BLUE}[+] Installing dependencies (ignoring native scripts)...${NC}"
    echo -e "${YELLOW}[!] Downloading NPM packages. This may take a few minutes depending on your internet connection...${NC}"
    cd "$PROJECT_DIR" || return 1
    npm install --ignore-scripts

    echo -e "\n${BLUE}[+] Building application...${NC}"
    echo -e "${YELLOW}[!] Compiling TypeScript frontend and Express server...${NC}"
    npm run build

    echo -e "\n${GREEN}[✓] Installation complete!${NC}"
}

start_background_process() {
    check_prereqs || return 1
    cd "$PROJECT_DIR" || return 1

    echo -e "${BLUE}[+] Starting Node.js server with SQLite...${NC}"
    # Kill existing server if running
    if [ -f .server.pid ]; then
        kill $(cat .server.pid) 2>/dev/null || true
        rm .server.pid
    fi

    NODE_ENV=production node dist/server.cjs > server.log 2>&1 &
    echo $! > .server.pid
    echo -e "${GREEN}[✓] Server started in background. (PID: $(cat .server.pid))${NC}"
}

graceful_shutdown_process() {
    cd "$PROJECT_DIR" || return 1

    echo -e "${BLUE}[+] Stopping Node.js server...${NC}"
    if [ -f .server.pid ]; then
        kill $(cat .server.pid) 2>/dev/null || true
        rm .server.pid
        echo -e "${GREEN}[✓] Server stopped.${NC}"
    else
        echo -e "${YELLOW}[!] Server PID file not found. Ensure server was started via script.${NC}"
        # Fallback to kill by port
        kill $(lsof -t -i :3000) 2>/dev/null || true
    fi
}

clean_environment_wipe() {
    cd "$PROJECT_DIR" || return 1

    echo -e "${RED}[!] WARNING: This will remove node_modules and build artifacts.${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        graceful_shutdown_process
        echo -e "${BLUE}[+] Removing node_modules and dist...${NC}"
        rm -rf node_modules dist server.js server.log .server.pid
        echo -e "${GREEN}[✓] Environment wiped cleanly.${NC}"
    else
        echo -e "${YELLOW}[!] Aborted.${NC}"
    fi
}

interactive_menu() {
    while true; do
        show_banner
        echo -e "Pilih menu pilihan (masukkan angka):"
        echo -e "  [1] Periksa Kesiapan Sistem (Node.js & npm)"
        echo -e "  [2] Jalankan Diagnostik Sistem (Doctor Mode)"
        echo -e "  [3] Instal Aplikasi (Pasang Dependensi & Build)"
        echo -e "  [4] Jalankan Server (Latar Belakang)"
        echo -e "  [5] Hentikan Server"
        echo -e "  [6] Hapus Instalasi (Wipe Environment)"
        echo -e "  [7] Keluar"
        echo ""
        read -p "Masukkan pilihan Anda [1-7]: " choice
        echo ""
        case "$choice" in
            1) check_prereqs ;;
            2) run_doctor ;;
            3) execute_idempotent_install ;;
            4) start_background_process ;;
            5) graceful_shutdown_process ;;
            6) clean_environment_wipe ;;
            7) echo -e "${GREEN}Keluar.${NC}"; exit 0 ;;
            *) echo -e "${RED}[!] Pilihan tidak valid. Silakan coba lagi.${NC}" ;;
        esac
        echo -e "\nTekan [Enter] untuk melanjutkan..."
        read
    done
}

if [ -z "$1" ]; then
    interactive_menu
else
    case "$1" in
        check-prereqs) check_prereqs ;;
        doctor)        run_doctor ;;
        install)       execute_idempotent_install ;;
        start)         start_background_process ;;
        stop)          graceful_shutdown_process ;;
        uninstall)     clean_environment_wipe ;;
        help|*)        show_help ;;
    esac
fi
