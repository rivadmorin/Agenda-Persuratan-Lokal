@echo off
:: ==============================================================================
:: Windows Launcher: Wrapper untuk deploy.ps1 (SQLite Offline Mode)
:: ==============================================================================
title Agenda Persuratan Lokal Launcher

:: Jalankan PowerShell script dengan mem-bypass pembatasan Execution Policy Windows
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
