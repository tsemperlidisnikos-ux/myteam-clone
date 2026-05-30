@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   Production DB - 2 steps
echo  ========================================
echo.
echo  STEP 1 - Create free PostgreSQL on Render
echo  -----------------------------------------
echo  Browser opens Render. Login with GitHub, click Apply.
echo  Wait ~2 min until myteam-db shows Active.
echo.
echo  Then in Render dashboard:
echo    myteam-db  -^>  Connect  -^>  External Database URL  -^>  Copy
echo.
start https://render.com/deploy?repo=https://github.com/tsemperlidisnikos-ux/myteam-clone
echo.
pause

echo.
echo  STEP 2 - Paste External Database URL below
echo  -----------------------------------------
set /p DBURL=postgres URL: 

if "%DBURL%"=="" (
  echo Empty URL. Cancelled.
  pause
  exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\finish-deploy.ps1" -DatabaseUrl "%DBURL%"
pause
