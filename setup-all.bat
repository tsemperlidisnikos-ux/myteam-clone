@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   MyTeam — Full Setup
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-all.ps1" %*
if errorlevel 1 (
  echo Setup failed.
  pause
  exit /b 1
)
echo.
echo Next: GitHub push
echo   powershell -ExecutionPolicy Bypass -File scripts\setup-github.ps1
echo.
pause
