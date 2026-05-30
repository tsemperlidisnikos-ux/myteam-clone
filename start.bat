@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

title MyTeam Launcher

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

echo ========================================
echo   MyTeam Clone
echo ========================================
echo.

if /i "%~1"=="help" goto help
if /i "%~1"=="/?" goto help
if /i "%~1"=="-h" goto help

if /i "%~1"=="backend" goto backend_only
if /i "%~1"=="frontend" goto frontend_only
if /i "%~1"=="mobile" goto mobile_only

REM Default: backend + frontend
goto start_web

:backend_only
start "MyTeam Backend" cmd /k "cd /d "%~dp0backend" && npm run migrate && npm run dev"
goto done

:frontend_only
start "MyTeam Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
goto done

:mobile_only
start "MyTeam Mobile" cmd /k "cd /d "%~dp0mobile" && npm start"
goto done

:start_web
echo Starting Backend (port 5000)...
start "MyTeam Backend" cmd /k "cd /d "%~dp0backend" && npm run migrate && npm run dev"

echo Waiting for backend...
timeout /t 3 /nobreak >nul

echo Starting Frontend (port 5173)...
start "MyTeam Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

if /i "%~1"=="all" (
  echo Starting Mobile (Expo)...
  timeout /t 2 /nobreak >nul
  start "MyTeam Mobile" cmd /k "cd /d "%~dp0mobile" && npm start"
)

goto done

:help
echo Usage:
echo   start.bat           Backend + Frontend
echo   start.bat all       Backend + Frontend + Mobile
echo   start.bat backend   Backend only
echo   start.bat frontend  Frontend only
echo   start.bat mobile    Mobile only (Expo)
echo.
echo URLs:
echo   Web:  http://localhost:5173
echo   API:  http://localhost:5000
echo.
exit /b 0

:done
echo.
echo Web:  http://localhost:5173
echo API:  http://localhost:5000/health
echo.
echo Login: nikos.tseberlidis@gmail.com / 123456
echo Close the Backend / Frontend windows to stop.
echo Or run: stop.bat
echo.
if /i not "%~1"=="help" if /i not "%~1"=="/?" if /i not "%~1"=="-h" (
  echo Tip: start.bat all  ^(includes mobile^)
)
exit /b 0
