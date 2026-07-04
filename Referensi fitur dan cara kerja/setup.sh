#!/bin/bash

# ==============================================================================
# Script Setup & Manajemen: Sistem Manajemen Agenda Persuratan Digital
# Kompatibel: Debian / Ubuntu / Linux derivatives
# Fitur: Install, Konfigurasi, Systemd Service, dan Uninstall dalam 1 skrip
# ==============================================================================

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Direktori proyek saat ini
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_NAME="agenda-surat"

# Fungsi Header Banner
show_banner() {
    clear
    echo -e "${CYAN}====================================================================${NC}"
    echo -e "${CYAN}    📨 SISTEM MANAJEMEN AGENDA PERSURATAN DIGITAL - SETUP SCRIPT   ${NC}"
    echo -e "${CYAN}====================================================================${NC}"
    echo -e "Direktori Kerja: ${BLUE}$PROJECT_DIR${NC}"
    echo ""
}

# Cek apakah dijalankan sebagai root (untuk systemd/apt)
check_root() {
    if [ "$EUID" -ne 0 ]; then
        return 1 # Bukan root
    else
        return 0 # Root
    fi
}

# Install Node.js jika belum ada (memerlukan root/sudo)
install_node() {
    echo -e "${YELLOW}[INFO] Memeriksa instalasi Node.js...${NC}"
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}[!] Node.js tidak terdeteksi.${NC}"
        if ! check_root; then
            echo -e "${RED}[ERROR] Silakan jalankan kembali skrip dengan sudo/root untuk menginstal Node.js secara otomatis, atau pasang Node.js secara manual terlebih dahulu.${NC}"
            echo -e "Perintah manual: sudo apt install nodejs npm"
            read -p "Tekan Enter untuk melanjutkan..."
            return 1
        fi
        
        echo -e "${BLUE}[+] Menginstal Node.js dan npm via repositori Debian...${NC}"
        apt-get update
        apt-get install -y curl gnupg
        
        # Gunakan NodeSource LTS
        echo -e "${BLUE}[+] Menambahkan repositori NodeSource LTS (Node.js v20)...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        
        if command -v node &> /dev/null; then
            echo -e "${GREEN}[✓] Node.js $(node -v) berhasil terpasang!${NC}"
        else
            echo -e "${RED}[ERROR] Gagal memasang Node.js secara otomatis. Pasang secara manual.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}[✓] Node.js sudah terpasang: $(node -v)${NC}"
    fi
}

# Proses Install Aplikasi
install_app() {
    show_banner
    echo -e "${BLUE}=== PROSES INSTALASI APLIKASI ===${NC}"
    echo ""
    
    # 1. Cek Node.js
    install_node
    
    # 2. Install Dependensi Proyek
    echo -e "\n${BLUE}[+] Memasang dependensi proyek (npm install)...${NC}"
    cd "$PROJECT_DIR"
    if npm install; then
        echo -e "${GREEN}[✓] Dependensi berhasil dipasang!${NC}"
    else
        echo -e "${RED}[ERROR] Gagal memasang dependensi. Silakan cek koneksi internet Anda atau logs.${NC}"
        exit 1
    fi
    
    # 3. Konfigurasi File .env
    echo -e "\n${BLUE}[+] Mengatur variabel lingkungan (.env)...${NC}"
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}[i] File .env baru telah disalin dari .env.example.${NC}"
        
        echo -e "\n${CYAN}Apakah Anda ingin memasukkan GEMINI_API_KEY sekarang?${NC}"
        echo -e "(Digunakan untuk ekstraksi berkas PDF otomatis bertenaga AI. Tekan Enter jika ingin melewati)"
        read -p "Masukan API Key: " gemini_key
        
        if [ ! -z "$gemini_key" ]; then
            # Ganti nilai di .env
            sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$gemini_key/g" .env
            echo -e "${GREEN}[✓] GEMINI_API_KEY berhasil disimpan ke file .env!${NC}"
        else
            echo -e "${YELLOW}[i] GEMINI_API_KEY dikosongkan. Anda dapat mengisinya nanti di file .env.${NC}"
        fi
    else
        echo -e "${GREEN}[✓] File .env sudah ada. Menggunakan konfigurasi yang sudah ada.${NC}"
    fi
    
    # 4. Bangun/Build Aplikasi
    echo -e "\n${BLUE}[+] Melakukan kompilasi/build proyek (npm run build)...${NC}"
    if npm run build; then
        echo -e "${GREEN}[✓] Kompilasi berhasil! Folder dist/ telah dibuat.${NC}"
    else
        echo -e "${RED}[ERROR] Kompilasi aplikasi gagal. Periksa kode sumber Anda.${NC}"
        exit 1
    fi
    
    # 5. Konfigurasi Systemd Service (Opsional)
    echo -e "\n${CYAN}Apakah Anda ingin menginstal aplikasi sebagai Systemd Service?${NC}"
    echo -e "Hal ini membuat aplikasi otomatis berjalan di latar belakang saat komputer menyala."
    read -p "Pasang sebagai service? (y/n, default: y): " install_svc
    install_svc=${install_svc:-y}
    
    if [[ "$install_svc" =~ ^[Yy]$ ]]; then
        if ! check_root; then
            echo -e "${YELLOW}[!] Hak akses administrator (root/sudo) diperlukan untuk membuat file service systemd.${NC}"
            echo -e "Mencoba mengelevasi hak akses menggunakan sudo..."
            sudo_cmd="sudo"
        else
            sudo_cmd=""
        fi
        
        # Ambil user non-root asli jika menggunakan sudo
        RUN_USER=${SUDO_USER:-$(whoami)}
        if [ "$RUN_USER" == "root" ]; then
            RUN_USER="root"
        fi
        
        echo -e "${BLUE}[+] Membuat file unit Systemd Service...${NC}"
        
        # Buat temporary file service
        cat <<EOF > /tmp/$SERVICE_NAME.service
[Unit]
Description=Sistem Manajemen Agenda Persuratan Digital
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/npm run start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        $sudo_cmd mv /tmp/$SERVICE_NAME.service /etc/systemd/system/
        $sudo_cmd systemctl daemon-reload
        $sudo_cmd systemctl enable $SERVICE_NAME
        $sudo_cmd systemctl start $SERVICE_NAME
        
        echo -e "${GREEN}[✓] Systemd Service '$SERVICE_NAME' berhasil dibuat dan dijalankan!${NC}"
        echo -e "    * Cek Status:  sudo systemctl status $SERVICE_NAME"
        echo -e "    * Mulai Ulang: sudo systemctl restart $SERVICE_NAME"
        echo -e "    * Matikan:     sudo systemctl stop $SERVICE_NAME"
    else
        echo -e "${YELLOW}[i] Systemd Service dilewati. Anda dapat menjalankan aplikasi secara manual menggunakan:${NC}"
        echo -e "    👉 npm run start"
    fi
    
    echo -e "\n${GREEN}====================================================================${NC}"
    echo -e "${GREEN}      🎉 INSTALASI SISTEM AGENDA PERSURATAN SELESAI DENGAN SUKSES!   ${NC}"
    echo -e "${GREEN}====================================================================${NC}"
    echo -e "Aplikasi sekarang berjalan di port ${BLUE}3000${NC}."
    echo -e "Buka peramban (browser) Anda dan akses alamat:"
    echo -e "👉 ${CYAN}http://localhost:3000${NC}"
    echo -e "===================================================================="
    read -p "Tekan Enter untuk kembali ke Menu Utama..."
}

# Proses Uninstall Aplikasi
uninstall_app() {
    show_banner
    echo -e "${RED}=== PROSES UNINSTALL / PENGHAPUSAN APLIKASI ===${NC}"
    echo -e "${YELLOW}Perhatian: Proses ini akan menghentikan sistem dan menghapus semua berkas build.${NC}"
    echo ""
    read -p "Apakah Anda benar-benar yakin ingin menghapus aplikasi ini? (y/n, default: n): " confirm_un
    confirm_un=${confirm_un:-n}
    
    if [[ ! "$confirm_un" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}[i] Proses uninstall dibatalkan.${NC}"
        read -p "Tekan Enter untuk kembali ke Menu Utama..."
        return
    fi
    
    # 1. Matikan dan Hapus Systemd Service jika ada
    echo -e "\n${BLUE}[+] Memeriksa Systemd Service...${NC}"
    if [ -f /etc/systemd/system/$SERVICE_NAME.service ] || systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
        if ! check_root; then
            echo -e "${YELLOW}[!] Hak akses administrator (root/sudo) diperlukan untuk menghapus service systemd.${NC}"
            sudo_cmd="sudo"
        else
            sudo_cmd=""
        fi
        
        echo -e "${YELLOW}[-] Menghentikan dan menonaktifkan service '$SERVICE_NAME'...${NC}"
        $sudo_cmd systemctl stop $SERVICE_NAME &>/dev/null
        $sudo_cmd systemctl disable $SERVICE_NAME &>/dev/null
        
        echo -e "${YELLOW}[-] Menghapus file unit service...${NC}"
        $sudo_cmd rm -f /etc/systemd/system/$SERVICE_NAME.service
        $sudo_cmd systemctl daemon-reload
        echo -e "${GREEN}[✓] Systemd Service berhasil dibersihkan!${NC}"
    else
        echo -e "${GREEN}[✓] Tidak ada Systemd Service terpasang.${NC}"
    fi
    
    # 2. Hapus file build dan folder dependensi
    echo -e "\n${BLUE}[-] Menghapus berkas hasil kompilasi (dist/)...${NC}"
    rm -rf "$PROJECT_DIR/dist"
    
    echo -e "${BLUE}[-] Menghapus folder modul dependensi (node_modules/)...${NC}"
    rm -rf "$PROJECT_DIR/node_modules"
    
    echo -e "${GREEN}[✓] Berkas build dan dependensi terpasang berhasil dibersihkan!${NC}"
    
    # 3. Opsi hapus konfigurasi .env dan basis data lokal
    echo -e "\n${CYAN}Apakah Anda ingin menghapus file konfigurasi .env dan basis data surat tersimpan?${NC}"
    echo -e "${RED}Peringatan: Hal ini akan menghapus semua data surat yang telah Anda buat!${NC}"
    read -p "Hapus file konfigurasi & basis data surat? (y/n, default: n): " clean_data
    clean_data=${clean_data:-n}
    
    if [[ "$clean_data" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[-] Menghapus file .env...${NC}"
        rm -f "$PROJECT_DIR/.env"
        
        echo -e "${YELLOW}[-] Menghapus direktori data penyimpanan (surat, unggahan, dll)...${NC}"
        rm -rf "$PROJECT_DIR/data"
        echo -e "${GREEN}[✓] Seluruh data konfigurasi dan basis data surat berhasil dihapus!${NC}"
    fi
    
    # 4. Opsi menghapus seluruh folder proyek
    echo -e "\n${RED}Apakah Anda ingin menghapus seluruh folder direktori proyek ini?${NC}"
    echo -e "Langkah ini tidak dapat dibatalkan."
    read -p "Hapus seluruh folder proyek? (y/n, default: n): " delete_folder
    delete_folder=${delete_folder:-n}
    
    if [[ "$delete_folder" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[-] Menghapus folder proyek...${NC}"
        cd ..
        rm -rf "$PROJECT_DIR"
        echo -e "${GREEN}[✓] Seluruh folder proyek berhasil dihapus dari sistem.${NC}"
        exit 0
    else
        echo -e "\n${GREEN}====================================================================${NC}"
        echo -e "${GREEN}       🎉 PEMBERSIHAN / UNINSTALL SEBAGIAN BERHASIL DILAKUKAN!       ${NC}"
        echo -e "===================================================================="
        echo -e "Kode sumber proyek Anda tetap dipertahankan di direktori saat ini."
        read -p "Tekan Enter untuk kembali..."
    fi
}

# ==============================================================================
# MENU UTAMA INTERAKTIF
# ==============================================================================
while true; do
    show_banner
    echo -e "Pilih salah satu menu di bawah ini:"
    echo -e "  ${BLUE}1)${NC} Pasang / Install Aplikasi ${GREEN}(Rekomendasi)${NC}"
    echo -e "  ${BLUE}2)${NC} Hapus / Uninstall Aplikasi ${RED}(Hapus total/sebagian)${NC}"
    echo -e "  ${BLUE}3)${NC} Keluar dari Skrip Setup"
    echo ""
    read -p "Masukkan pilihan Anda [1-3]: " choice
    
    case $choice in
        1)
            install_app
            ;;
        2)
            uninstall_app
            ;;
        3)
            echo -e "\n${GREEN}Terima kasih telah menggunakan sistem kami. Sampai jumpa!${NC}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}[ERROR] Pilihan tidak valid. Silakan pilih 1, 2, atau 3.${NC}"
            sleep 1.5
            ;;
    esac
done
