@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   MyTeam — GitHub Push
echo ========================================
echo.

git remote -v 2>nul | findstr origin >nul
if errorlevel 1 (
  echo Δεν υπάρχει remote "origin".
  echo.
  echo 1. Δημιούργησε repo στο GitHub
  echo 2. Τρέξε:
  echo    git remote add origin https://github.com/USER/REPO.git
  echo    push-github.bat
  echo.
  pause
  exit /b 1
)

git status --short
echo.
set /p CONFIRM=Push στο origin; (y/N): 
if /i not "%CONFIRM%"=="y" exit /b 0

git push -u origin master
if errorlevel 1 (
  echo.
  echo Αποτυχία push. Δοκίμασε:
  echo   git branch -M main
  echo   git push -u origin main
)
pause
