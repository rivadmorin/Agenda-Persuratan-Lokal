# ==============================================================================
# Script Setup: Sistem Manajemen Agenda Persuratan Digital (PostgreSQL-Only)
# Filosofi: Simple, Hemat Sumber Daya, Cepat, Stabil, Lokal, & Portable
# ==============================================================================

# 1. Cek Docker
Write-Host "[INFO] Memeriksa Docker..." -ForegroundColor Yellow
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCheck) {
    Write-Host "[ERROR] Docker tidak ditemukan!" -ForegroundColor Red
    Write-Host "Aplikasi ini membutuhkan PostgreSQL via Docker untuk stabilitas data." -ForegroundColor Yellow
    Write-Host "Silakan instal Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    exit 1
}
Write-Host "[✓] Docker ditemukan." -ForegroundColor Green

# 2. Jalankan Database
Write-Host "[+] Menjalankan PostgreSQL via Docker Compose..." -ForegroundColor Blue
docker compose up -d

# 3. Install & Build
Write-Host "`n[+] Memasang dependensi (npm install)..." -ForegroundColor Blue
npm install

Write-Host "`n[+] Membangun aplikasi (npm run build)..." -ForegroundColor Blue
npm run build

Write-Host "`n====================================================================" -ForegroundColor Green
Write-Host "      🎉 SETUP SELESAI! APLIKASI SIAP DIJALANKAN.                   " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "Jalankan perintah berikut untuk memulai server:" -ForegroundColor Yellow
Write-Host "👉 npm run start" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Green
