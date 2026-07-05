#!/bin/bash

# ==============================================================================
# Script Setup: Sistem Manajemen Agenda Persuratan Digital
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
    echo -e "${CYAN}    🚀 LAUNCHPAD: Persuratan Digital Orchestrator                  ${NC}"
    echo -e "${CYAN}====================================================================${NC}"
    echo ""
}

show_help() {
    show_banner
    echo -e "Usage: ./launchpad/deploy.sh [command]"
    echo -e "Commands:"
    echo -e "  ${GREEN}check-prereqs${NC} : Verifies system dependencies (Node, pnpm, Docker)"
    echo -e "  ${GREEN}install${NC}       : Installs dependencies and builds the application"
    echo -e "  ${GREEN}start${NC}         : Starts PostgreSQL and the Node.js server"
    echo -e "  ${GREEN}stop${NC}          : Stops the Node.js server and PostgreSQL container"
    echo -e "  ${GREEN}uninstall${NC}     : Removes node_modules, build artifacts, and stops DB"
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

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}[ERROR] pnpm is not installed. Run: npm install -g pnpm${NC}"
        return 1
    fi
    echo -e "${GREEN}[✓] pnpm found: $(pnpm -v)${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR] Docker is not installed.${NC}"
        echo -e "This application requires PostgreSQL via Docker."
        return 1
    fi
    echo -e "${GREEN}[✓] Docker found.${NC}"
    return 0
}

execute_idempotent_install() {
    check_prereqs || return 1
    echo -e "\n${BLUE}[+] Installing dependencies...${NC}"
    cd "$PROJECT_DIR" || return 1
    pnpm install

    echo -e "\n${BLUE}[+] Building application...${NC}"
    pnpm run build

    echo -e "\n${GREEN}[✓] Installation complete!${NC}"
}

start_background_process() {
    check_prereqs || return 1
    cd "$PROJECT_DIR" || return 1

    echo -e "${BLUE}[+] Starting PostgreSQL via Docker Compose...${NC}"
    docker compose up -d

    echo -e "${BLUE}[+] Starting Node.js server...${NC}"
    # Kill existing server if running
    if [ -f .server.pid ]; then
        kill $(cat .server.pid) 2>/dev/null || true
        rm .server.pid
    fi

    pnpm run start > server.log 2>&1 &
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

    echo -e "${BLUE}[+] Stopping PostgreSQL...${NC}"
    docker compose stop
    echo -e "${GREEN}[✓] Database stopped.${NC}"
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

case "$1" in
    check-prereqs) check_prereqs ;;
    install)       execute_idempotent_install ;;
    start)         start_background_process ;;
    stop)          graceful_shutdown_process ;;
    uninstall)     clean_environment_wipe ;;
    help|*)        show_help ;;
esac
