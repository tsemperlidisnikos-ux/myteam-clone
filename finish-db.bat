@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ONE CLICK - Accept Neon terms in browser, then press any key
echo  URL: https://vercel.com/tsemperlidisnikos-3650s-projects/~/integrations/accept-terms/neon
echo.
start https://vercel.com/tsemperlidisnikos-3650s-projects/~/integrations/accept-terms/neon
pause

vercel integration add neon
if errorlevel 1 (
  echo Neon install failed. Use Render instead:
  start https://render.com/deploy?repo=https://github.com/tsemperlidisnikos-ux/myteam-clone
  echo Copy DATABASE_URL from Render dashboard, then run:
  echo   powershell -File scripts\finish-deploy.ps1 -DatabaseUrl "YOUR_URL"
  pause
  exit /b 1
)

echo Done. Check Vercel dashboard for DATABASE_URL on backend project.
pause
