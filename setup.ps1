# ==============================================================================
# Script Setup & Manajemen: Sistem Manajemen Agenda Persuratan Digital
# Kompatibel: Windows PowerShell (Windows 10 / 11 / Server)
# Fitur: Install, Konfigurasi, Auto-start Latar Belakang (Silent), dan Uninstall
# ==============================================================================

# Atur Encoding agar output rapi
$OutputEncoding = [System.Text.Encoding]::UTF8

# Mendapatkan direktori proyek saat ini
$PROJECT_DIR = $PSScriptRoot
if (-not $PROJECT_DIR) {
    $PROJECT_DIR = Get-Location
}

# Fungsi Header Banner
function Show-Banner {
    Clear-Host
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "    📨 SISTEM AGENDA PERSURATAN DIGITAL - WINDOWS SETUP SCRIPT     " -ForegroundColor Cyan
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "Direktori Kerja: $PROJECT_DIR" -ForegroundColor Blue
    Write-Host ""
}

# Cek instalasi Node.js
function Check-NodeInstalled {
    Write-Host "[INFO] Memeriksa instalasi Node.js..." -ForegroundColor Yellow
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCheck) {
        Write-Host "[!] Node.js tidak terdeteksi di sistem Anda." -ForegroundColor Red
        Write-Host "Silakan unduh dan pasang Node.js LTS (versi 18 ke atas) dari:" -ForegroundColor Yellow
        Write-Host "👉 https://nodejs.org/" -ForegroundColor Cyan
        Write-Host "Setelah instalasi selesai, silakan buka kembali terminal PowerShell baru dan jalankan skrip ini." -ForegroundColor Yellow
        Read-Host "Tekan Enter untuk melanjutkan..."
        return $false
    } else {
        $nodeVer = & node -v
        Write-Host "[✓] Node.js sudah terpasang: $nodeVer" -ForegroundColor Green
        return $true
    }
}

# Proses Install Aplikasi
function Install-App {
    Show-Banner
    Write-Host "=== PROSES INSTALASI APLIKASI ===" -ForegroundColor Blue
    Write-Host ""

    # 1. Cek Node.js
    if (-not (Check-NodeInstalled)) {
        return
    }

    # 2. Pasang Dependensi
    Write-Host "`n[+] Memasang dependensi proyek (npm install)..." -ForegroundColor Blue
    Set-Location $PROJECT_DIR
    try {
        & npm install
        Write-Host "[✓] Dependensi berhasil dipasang!" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Gagal memasang dependensi. Pastikan koneksi internet aktif." -ForegroundColor Red
        Read-Host "Tekan Enter untuk kembali..."
        return
    }

    # 3. Konfigurasi .env
    Write-Host "`n[+] Mengatur file konfigurasi (.env)..." -ForegroundColor Blue
    $envPath = Join-Path $PROJECT_DIR ".env"
    $envExamplePath = Join-Path $PROJECT_DIR ".env.example"
    
    if (-not (Test-Path $envPath)) {
        if (Test-Path $envExamplePath) {
            Copy-Item $envExamplePath $envPath
            Write-Host "[i] File .env baru telah disalin dari .env.example." -ForegroundColor Yellow
        } else {
            # Buat file kosong jika tidak ada
            New-Item -Path $envPath -ItemType File -Value "GEMINI_API_KEY=`n" -Force | Out-Null
        }

        Write-Host "`nApakah Anda ingin memasukkan GEMINI_API_KEY sekarang?" -ForegroundColor Cyan
        Write-Host "(Digunakan untuk ekstraksi berkas PDF otomatis bertenaga AI. Tekan Enter untuk melewati)" -ForegroundColor Gray
        $geminiKey = Read-Host "Masukan API Key"
        if ($geminiKey) {
            (Get-Content $envPath) -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$geminiKey" | Set-Content $envPath
            Write-Host "[✓] GEMINI_API_KEY berhasil disimpan ke file .env!" -ForegroundColor Green
        } else {
            Write-Host "[i] GEMINI_API_KEY dikosongkan. Anda dapat mengisinya nanti di file .env." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[✓] File .env sudah ada. Menggunakan konfigurasi yang sudah ada." -ForegroundColor Green
    }

    # 4. Bangun / Build Aplikasi
    Write-Host "`n[+] Melakukan kompilasi/build proyek (npm run build)..." -ForegroundColor Blue
    try {
        & npm run build
        Write-Host "[✓] Kompilasi berhasil! Folder dist/ telah dibuat." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Kompilasi aplikasi gagal. Periksa kode sumber Anda." -ForegroundColor Red
        Read-Host "Tekan Enter untuk kembali..."
        return
    }

    # 5. Konfigurasi Launcher Script (CMD)
    Write-Host "`n[+] Membuat skrip peluncur lokal..." -ForegroundColor Blue
    $batPath = Join-Path $PROJECT_DIR "start-app.bat"
    $batContent = @"
@echo off
cd /d "%~dp0"
npm run start
"@
    Set-Content -Path $batPath -Value $batContent
    Write-Host "[✓] Skrip start-app.bat berhasil dibuat." -ForegroundColor Green

    # 6. Konfigurasi Auto-Start di Windows (Background Silent Mode via VBS)
    Write-Host "`nApakah Anda ingin agar aplikasi ini otomatis berjalan secara tersembunyi (background) saat komputer dinyalakan/login?" -ForegroundColor Cyan
    $autoStartChoice = Read-Host "Pasang auto-start? (y/n, default: y)"
    if ($autoStartChoice -eq "") { $autoStartChoice = "y" }

    if ($autoStartChoice -eq "y" -or $autoStartChoice -eq "Y") {
        # Buat launcher VBS agar tidak memunculkan jendela CMD hitam yang mengganggu
        $vbsPath = Join-Path $PROJECT_DIR "launch.vbs"
        $vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c start-app.bat", 0, False
"@
        Set-Content -Path $vbsPath -Value $vbsContent
        Write-Host "[i] Skrip latar belakang launch.vbs berhasil disiapkan." -ForegroundColor Yellow

        # Buat shortcut di Startup folder
        $startupDir = [Environment]::GetFolderPath("Startup")
        $shortcutPath = Join-Path $startupDir "AgendaPersuratanAutoStart.lnk"
        
        try {
            $wshShell = New-Object -ComObject WScript.Shell
            $shortcut = $wshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "wscript.exe"
            $shortcut.Arguments = "`"$vbsPath`""
            $shortcut.WorkingDirectory = $PROJECT_DIR
            $shortcut.Description = "Sistem Agenda Persuratan Auto Start"
            $shortcut.Save()
            Write-Host "[✓] Shortcut otomatis ditambahkan ke direktori Startup Windows!" -ForegroundColor Green
        } catch {
            Write-Host "[!] Gagal membuat shortcut Startup otomatis secara programmatik." -ForegroundColor Red
        }
    }

    # 7. Buat Pintasan Desktop (Browser Shortcut)
    Write-Host "`nApakah Anda ingin membuat shortcut di Desktop untuk membuka aplikasi ini?" -ForegroundColor Cyan
    $desktopChoice = Read-Host "Buat shortcut desktop? (y/n, default: y)"
    if ($desktopChoice -eq "") { $desktopChoice = "y" }

    if ($desktopChoice -eq "y" -or $desktopChoice -eq "Y") {
        $desktopDir = [Environment]::GetFolderPath("Desktop")
        $urlShortcutPath = Join-Path $desktopDir "Agenda Persuratan Digital.url"
        
        $urlContent = @"
[InternetShortcut]
URL=http://localhost:3000
"@
        Set-Content -Path $urlShortcutPath -Value $urlContent
        Write-Host "[✓] Shortcut internet 'Agenda Persuratan Digital' berhasil ditambahkan ke Desktop!" -ForegroundColor Green
    }

    # Jalankan aplikasi sekarang secara latar belakang
    Write-Host "`nApakah Anda ingin menjalankan aplikasi sekarang di latar belakang?" -ForegroundColor Cyan
    $runNow = Read-Host "Jalankan sekarang? (y/n, default: y)"
    if ($runNow -eq "") { $runNow = "y" }
    
    if ($runNow -eq "y" -or $runNow -eq "Y") {
        if (Test-Path $vbsPath) {
            Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -WorkingDirectory $PROJECT_DIR
            Write-Host "[✓] Aplikasi berhasil dijalankan secara silent di latar belakang!" -ForegroundColor Green
        } else {
            Start-Process -FilePath $batPath -WindowStyle Minimized
            Write-Host "[✓] Aplikasi dijalankan secara minimalis!" -ForegroundColor Green
        }
    }

    Write-Host "`n====================================================================" -ForegroundColor Green
    Write-Host "      🎉 INSTALASI SISTEM AGENDA PERSURATAN SELESAI DENGAN SUKSES!   " -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "Aplikasi sekarang berjalan di port 3000." -ForegroundColor Green
    Write-Host "Buka browser Anda dan akses alamat:" -ForegroundColor Green
    Write-Host "👉 http://localhost:3000" -ForegroundColor Cyan
    Write-Host "====================================================================" -ForegroundColor Green
    Read-Host "Tekan Enter untuk kembali ke Menu Utama..."
}

# Proses Uninstall Aplikasi
function Uninstall-App {
    Show-Banner
    Write-Host "=== PROSES UNINSTALL / PENGHAPUSAN APLIKASI ===" -ForegroundColor Red
    Write-Host "Perhatian: Proses ini akan menghentikan sistem dan menghapus seluruh berkas build." -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Apakah Anda benar-benar yakin ingin menghapus aplikasi ini? (y/n, default: n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "[i] Proses uninstall dibatalkan." -ForegroundColor Blue
        Read-Host "Tekan Enter untuk kembali..."
        return
    }

    # 1. Hentikan aplikasi jika sedang berjalan (Port 3000)
    Write-Host "`n[+] Menghentikan proses aplikasi yang sedang berjalan pada port 3000..." -ForegroundColor Blue
    $portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique -ErrorAction SilentlyContinue
    if ($portProcess) {
        try {
            Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
            Write-Host "[✓] Proses server di port 3000 berhasil dihentikan." -ForegroundColor Green
        } catch {
            Write-Host "[!] Gagal menghentikan proses di port 3000 secara otomatis." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[✓] Tidak ada proses aplikasi aktif di port 3000." -ForegroundColor Green
    }

    # 2. Hapus Shortcut Desktop dan Startup
    Write-Host "`n[-] Menghapus shortcut dan konfigurasi start..." -ForegroundColor Blue
    $desktopDir = [Environment]::GetFolderPath("Desktop")
    $urlShortcutPath = Join-Path $desktopDir "Agenda Persuratan Digital.url"
    if (Test-Path $urlShortcutPath) {
        Remove-Item $urlShortcutPath -Force
        Write-Host "[✓] Shortcut Desktop dihapus." -ForegroundColor Green
    }

    $startupDir = [Environment]::GetFolderPath("Startup")
    $shortcutPath = Join-Path $startupDir "AgendaPersuratanAutoStart.lnk"
    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
        Write-Host "[✓] Shortcut Startup otomatis dihapus." -ForegroundColor Green
    }

    # Hapus file pendukung internal
    $batPath = Join-Path $PROJECT_DIR "start-app.bat"
    $vbsPath = Join-Path $PROJECT_DIR "launch.vbs"
    if (Test-Path $batPath) { Remove-Item $batPath -Force }
    if (Test-Path $vbsPath) { Remove-Item $vbsPath -Force }

    # 3. Hapus berkas build dan dependensi
    Write-Host "`n[-] Menghapus folder kompilasi (dist/)..." -ForegroundColor Blue
    if (Test-Path (Join-Path $PROJECT_DIR "dist")) {
        Remove-Item (Join-Path $PROJECT_DIR "dist") -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[-] Menghapus modul dependensi terpasang (node_modules/)..." -ForegroundColor Blue
    if (Test-Path (Join-Path $PROJECT_DIR "node_modules")) {
        Remove-Item (Join-Path $PROJECT_DIR "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[✓] Folder dependensi berhasil dihapus!" -ForegroundColor Green
    }

    # 4. Bersihkan data penyimpanan dan .env (opsional)
    Write-Host "`nApakah Anda ingin menghapus file konfigurasi .env dan basis data surat?" -ForegroundColor Cyan
    Write-Host "Peringatan: Hal ini akan menghapus semua agenda surat terdaftar!" -ForegroundColor Red
    $cleanData = Read-Host "Hapus file konfigurasi & basis data? (y/n, default: n)"
    
    if ($cleanData -eq "y" -or $cleanData -eq "Y") {
        $envPath = Join-Path $PROJECT_DIR ".env"
        $dataPath = Join-Path $PROJECT_DIR "data"
        if (Test-Path $envPath) { Remove-Item $envPath -Force }
        if (Test-Path $dataPath) { Remove-Item $dataPath -Recurse -Force -ErrorAction SilentlyContinue }
        Write-Host "[✓] Konfigurasi dan basis data terhapus sepenuhnya." -ForegroundColor Green
    }

    # 5. Opsi hapus seluruh direktori proyek
    Write-Host "`nApakah Anda ingin menghapus seluruh direktori folder proyek ini dari sistem?" -ForegroundColor Red
    $deleteFolder = Read-Host "Hapus seluruh folder proyek? (y/n, default: n)"
    
    if ($deleteFolder -eq "y" -or $deleteFolder -eq "Y") {
        Write-Host "[i] Menghapus folder proyek..." -ForegroundColor Yellow
        $parentDir = Split-Path $PROJECT_DIR -Parent
        Set-Location $parentDir
        Remove-Item $PROJECT_DIR -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[✓] Folder proyek terhapus sepenuhnya!" -ForegroundColor Green
        Exit
    } else {
        Write-Host "`n====================================================================" -ForegroundColor Green
        Write-Host "       🎉 PEMBERSIHAN / UNINSTALL SEBAGIAN BERHASIL DILAKUKAN!       " -ForegroundColor Green
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host "Seluruh kode sumber asli tetap dipertahankan di folder saat ini." -ForegroundColor Green
        Read-Host "Tekan Enter untuk kembali..."
    }
}

# ==============================================================================
# MENU UTAMA INTERAKTIF
# ==============================================================================
while ($true) {
    Show-Banner
    Write-Host "Pilih salah satu menu di bawah ini:" -ForegroundColor White
    Write-Host "  1) Pasang / Install Aplikasi" -ForegroundColor Blue
    Write-Host "  2) Hapus / Uninstall Aplikasi" -ForegroundColor Red
    Write-Host "  3) Keluar dari Skrip Setup" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Masukkan pilihan Anda [1-3]"
    
    switch ($choice) {
        "1" {
            Install-App
        }
        "2" {
            Uninstall-App
        }
        "3" {
            Write-Host "`nTerima kasih telah menggunakan sistem kami. Sampai jumpa!`n" -ForegroundColor Green
            Break
        }
        default {
            Write-Host "`n[ERROR] Pilihan tidak valid. Pilih 1, 2, atau 3." -ForegroundColor Red
            Start-Sleep -Seconds 1.5
        }
    }
}
