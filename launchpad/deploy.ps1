# ==============================================================================
# Script Setup: Sistem Manajemen Agenda Persuratan Digital (SQLite Offline Mode)
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Resolve-Path (Join-Path $ScriptDir "..") | Select-Object -ExpandProperty Path

function Show-Banner {
    Clear-Host
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "    🚀 LAUNCHPAD: Persuratan Digital Orchestrator (SQLite)        " -ForegroundColor Cyan
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "Usage: .\launchpad\deploy.ps1 [command]"
    Write-Host "Commands:"
    Write-Host "  check-prereqs : Verifies system dependencies (Node, npm)" -ForegroundColor Green
    Write-Host "  install       : Installs dependencies and builds the application" -ForegroundColor Green
    Write-Host "  start         : Starts the Node.js server with SQLite" -ForegroundColor Green
    Write-Host "  stop          : Stops the Node.js server" -ForegroundColor Green
    Write-Host "  uninstall     : Removes node_modules, build artifacts, and stops server" -ForegroundColor Green
    Write-Host "  help          : Displays this help menu" -ForegroundColor Green
    Write-Host ""
}

function Check-Prereqs {
    Write-Host "[+] Checking prerequisites..." -ForegroundColor Blue

    # Check Node
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCheck) {
        Write-Host "[ERROR] Node.js is not installed." -ForegroundColor Red
        return $false
    }
    $nodeVersion = (node -v).Trim()
    Write-Host "[✓] Node.js found: $nodeVersion" -ForegroundColor Green

    # Check npm
    $npmCheck = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCheck) {
        Write-Host "[ERROR] npm is not installed." -ForegroundColor Red
        return $false
    }
    $npmVersion = (npm -v).Trim()
    Write-Host "[✓] npm found: $npmVersion" -ForegroundColor Green
    return $true
}

function Execute-Idempotent-Install {
    if (-not (Check-Prereqs)) { return }

    Write-Host "`n[+] Installing dependencies (ignoring native scripts)..." -ForegroundColor Blue
    Set-Location $ProjectDir
    npm install --ignore-scripts

    Write-Host "`n[+] Building application..." -ForegroundColor Blue
    npm run build

    Write-Host "`n[✓] Installation complete!" -ForegroundColor Green
}

function Start-Background-Process {
    if (-not (Check-Prereqs)) { return }
    Set-Location $ProjectDir

    Write-Host "[+] Starting Node.js server with SQLite..." -ForegroundColor Blue
    # Kill existing server if running
    if (Test-Path ".server.pid") {
        $pidFile = Get-Content ".server.pid"
        Stop-Process -Id $pidFile -Force -ErrorAction SilentlyContinue
        Remove-Item ".server.pid" -Force
    }

    $process = Start-Process -FilePath "npm" -ArgumentList "run start" -RedirectStandardOutput "server.log" -RedirectStandardError "server.log" -WindowStyle Hidden -PassThru
    $process.Id | Out-File ".server.pid"
    Write-Host "[✓] Server started in background. (PID: $($process.Id))" -ForegroundColor Green
}

function Graceful-Shutdown-Process {
    Set-Location $ProjectDir

    Write-Host "[+] Stopping Node.js server..." -ForegroundColor Blue
    if (Test-Path ".server.pid") {
        $pidFile = Get-Content ".server.pid"
        Stop-Process -Id $pidFile -Force -ErrorAction SilentlyContinue
        Remove-Item ".server.pid" -Force
        Write-Host "[✓] Server stopped." -ForegroundColor Green
    } else {
        Write-Host "[!] Server PID file not found. Ensure server was started via script." -ForegroundColor Yellow
    }
}

function Clean-Environment-Wipe {
    Set-Location $ProjectDir

    Write-Host "[!] WARNING: This will remove node_modules and build artifacts." -ForegroundColor Red
    $choice = Read-Host "Are you sure? (y/N) "
    if ($choice -match '^[Yy]$') {
        Graceful-Shutdown-Process
        Write-Host "[+] Removing node_modules and dist..." -ForegroundColor Blue
        Remove-Item -Path "node_modules", "dist", "server.js", "server.log", ".server.pid" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[✓] Environment wiped cleanly." -ForegroundColor Green
    } else {
        Write-Host "[!] Aborted." -ForegroundColor Yellow
    }
}

$command = $args[0]

switch ($command) {
    "check-prereqs" { Check-Prereqs }
    "install"       { Execute-Idempotent-Install }
    "start"         { Start-Background-Process }
    "stop"          { Graceful-Shutdown-Process }
    "uninstall"     { Clean-Environment-Wipe }
    default         { Show-Help }
}
