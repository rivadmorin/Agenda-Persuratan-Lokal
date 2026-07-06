# ==============================================================================
# Script Pengemasan Offline (Windows): Membuat Bundle Agenda Persuratan Lokal
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Resolve-Path (Join-Path $ScriptDir "..") | Select-Object -ExpandProperty Path
Set-Location $ProjectDir

Write-Host "[+] Menyiapkan build produksi terbaru..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Gagal melakukan build produksi." -ForegroundColor Red
    exit 1
}

$ReleaseDir = Join-Path $ProjectDir "release"
$TempDir = Join-Path $ReleaseDir "agenda-persuratan-lokal"

# Bersihkan rilis lama
if (Test-Path $ReleaseDir) { Remove-Item $ReleaseDir -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Host "[+] Menyalin berkas operasional ke folder sementara..." -ForegroundColor Blue
Copy-Item -Path "dist" -Destination $TempDir -Recurse -Force
Copy-Item -Path "node_modules" -Destination $TempDir -Recurse -Force
Copy-Item -Path "launchpad" -Destination $TempDir -Recurse -Force
Copy-Item -Path "schema.sql", "package.json", "README.md" -Destination $TempDir -Force

# Buat folder data kosong agar database diinisialisasi bersih di sisi klien
New-Item -ItemType Directory -Path (Join-Path $TempDir "data") -Force | Out-Null

# Hapus berkas logs atau PID jika ada di dalam folder launchpad salinan
Remove-Item -Path (Join-Path $TempDir "launchpad\server.log"), (Join-Path $TempDir "launchpad\.server.pid") -Force -ErrorAction SilentlyContinue

Write-Host "[+] Membuat berkas ZIP agenda-persuratan-windows-x64.zip..." -ForegroundColor Blue
Compress-Archive -Path "$TempDir" -DestinationPath "$ReleaseDir\agenda-persuratan-windows-x64.zip" -Force

Write-Host "[+] Membersihkan berkas sementara..." -ForegroundColor Blue
Remove-Item $TempDir -Recurse -Force

Write-Host "[✓] Paket offline berhasil dibuat di: release\agenda-persuratan-windows-x64.zip" -ForegroundColor Green
