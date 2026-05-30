@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   GitHub Login (device flow)
echo ========================================
echo.
echo 1. Copy the one-time code shown below
echo 2. Browser opens - paste code and authorize
echo 3. Then run: push-github.bat
echo.

gh auth login -h github.com -p https -w
if errorlevel 1 exit /b 1

echo.
echo Login OK. Creating repo and pushing...
call push-github.bat
