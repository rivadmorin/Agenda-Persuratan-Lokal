@echo off
:: ==============================================================================
:: Windows One-Click Start: Menjalankan server lokal persuratan
:: ==============================================================================
title Start Agenda Persuratan Lokal
cd /d "%~dp0.."

echo [+] Memeriksa folder build...
if not exist dist (
    echo [!] Folder build (dist) tidak ditemukan. Membuat build produksi...
    call npm run build
)

echo.
echo [+] Memulai server lokal (SQLite)...
echo.
call npm run start
pause
