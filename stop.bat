@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo Stopping MyTeam...

taskkill /FI "WINDOWTITLE eq MyTeam Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq MyTeam Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq MyTeam Mobile*" /T /F >nul 2>&1

echo Done. (If ports stay busy, close any remaining cmd windows manually.)
timeout /t 2 /nobreak >nul
