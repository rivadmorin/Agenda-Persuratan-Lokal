# ==============================================================================
# PowerShell One-Line Installer untuk Windows - Agenda Persuratan Lokal
# ==============================================================================
$ErrorActionPreference = "Stop"

# Setup encoding to avoid issues with special characters
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================" -ForegroundColor Blue
Write-Host "      Sistem Agenda Persuratan Lokal Installer (Windows)      " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Blue

# 1. Periksa Prasyarat
Write-Host "`n[+] Memeriksa prasyarat sistem..." -ForegroundColor Blue

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[ERROR] Node.js tidak ditemukan! Silakan pasang Node.js v20+ terlebih dahulu dari https://nodejs.org/" -ForegroundColor Red
    return
}

$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "[ERROR] Git tidak ditemukan! Silakan pasang Git terlebih dahulu dari https://git-scm.com/" -ForegroundColor Red
    return
}

Write-Host "[✓] Prasyarat sistem terpenuhi." -ForegroundColor Green

# 2. Tentukan Direktori Target & Kloning
$TargetDir = "agenda-persuratan-lokal"

if (Test-Path $TargetDir) {
    Write-Host "`n[!] Direktori '$TargetDir' sudah ada. Melakukan pembaruan kode..." -ForegroundColor Yellow
    Set-Location $TargetDir
    git pull
} else {
    Write-Host "`n[+] Mengkloning repositori dari GitHub..." -ForegroundColor Blue
    git clone https://github.com/rivadmorin/Agenda-Persuratan-Lokal.git $TargetDir
    Set-Location $TargetDir
}

# 3. Jalankan Skrip Instalasi
Write-Host "`n[+] Menjalankan instalasi aplikasi..." -ForegroundColor Blue
Write-Host "[!] Catatan: Proses ini memerlukan waktu beberapa menit untuk mengunduh semua berkas (node_modules) dan mem-build sistem. Harap tunggu dan jangan menutup PowerShell Anda..." -ForegroundColor Yellow
if (Test-Path "launchpad/deploy.ps1") {
    powershell -NoProfile -ExecutionPolicy Bypass -File "launchpad/deploy.ps1" install
} else {
    Write-Host "[ERROR] Skrip install internal tidak ditemukan!" -ForegroundColor Red
    return
}

# 4. Selesai
Write-Host "`n[✓] Pemasangan berhasil diselesaikan!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Blue
Write-Host "Untuk menjalankan server aplikasi, jalankan perintah:" -ForegroundColor White
Write-Host "  cd $TargetDir; powershell -ExecutionPolicy Bypass -File launchpad/deploy.ps1 start" -ForegroundColor Yellow
Write-Host "`nLalu buka browser Anda di: http://localhost:3000" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Blue
