@echo off
:: ==============================================================================
:: Windows One-Click Pack: Pengemasan otomatis ke file ZIP offline
:: ==============================================================================
title Pack Offline Release
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pack-offline.ps1"
pause
