# One-click production deploy setup (Neon + Railway + Vercel)
param(
  [switch]$OpenBrowser,
  [switch]$GenerateJwt
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Repo = "https://github.com/tsemperlidisnikos-ux/myteam-clone"
$NeonUrl = "https://console.neon.tech/"
$RailwayUrl = "https://railway.com/new/github"
$VercelUrl = "https://vercel.com/new/import?s=$([uri]::EscapeDataString($Repo))"

Write-Host ""
Write-Host "=== MyTeam Production Deploy ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repo: $Repo"
Write-Host ""

if ($GenerateJwt -or -not $env:JWT_SECRET) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $jwt = [Convert]::ToBase64String($bytes)
  Write-Host "Generated JWT_SECRET (copy to Railway):" -ForegroundColor Green
  Write-Host "  $jwt"
  Write-Host ""
}

Write-Host "STEP 1 — Neon PostgreSQL" -ForegroundColor Yellow
Write-Host "  1. Create project at $NeonUrl"
Write-Host "  2. Copy connection string (with ?sslmode=require)"
Write-Host "  3. Paste as DATABASE_URL in Railway"
Write-Host ""

Write-Host "STEP 2 — Railway (API)" -ForegroundColor Yellow
Write-Host "  1. Open: $RailwayUrl"
Write-Host "  2. Select repo: tsemperlidisnikos-ux/myteam-clone"
Write-Host "  3. Settings -> Root Directory: backend"
Write-Host "  4. Variables (from backend/.env.production.example):"
Write-Host "       DATABASE_URL, JWT_SECRET, FRONTEND_URL, NODE_ENV=production, PORT=5000"
Write-Host "  5. Deploy runs: npm run migrate && npm start"
Write-Host "  6. Copy public URL (e.g. https://xxx.up.railway.app)"
Write-Host ""

Write-Host "STEP 3 — Vercel (Frontend)" -ForegroundColor Yellow
Write-Host "  1. Open: $VercelUrl"
Write-Host "  2. Root Directory: frontend"
Write-Host "  3. Env: VITE_API_URL = your Railway URL"
Write-Host "  4. Deploy"
Write-Host ""

Write-Host "STEP 4 — Link back to Railway" -ForegroundColor Yellow
Write-Host "  Set FRONTEND_URL in Railway = your Vercel URL (exact, for CORS)"
Write-Host "  Redeploy Railway if needed"
Write-Host ""

Write-Host "STEP 5 — Verify" -ForegroundColor Yellow
Write-Host "  curl https://YOUR-API/health"
Write-Host "  Open Vercel URL -> login"
Write-Host ""

Write-Host "Optional — GitHub Actions deploy (after manual setup once):" -ForegroundColor DarkGray
Write-Host "  Add secrets: RAILWAY_TOKEN, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VITE_API_URL"
Write-Host "  Run workflow: Deploy (manual)"
Write-Host ""

if ($OpenBrowser) {
  Start-Process $NeonUrl
  Start-Sleep -Seconds 1
  Start-Process $RailwayUrl
  Start-Sleep -Seconds 1
  Start-Process $VercelUrl
  Write-Host "Opened Neon, Railway, and Vercel in browser." -ForegroundColor Green
}

Write-Host "Full checklist: DEPLOY.md" -ForegroundColor Cyan
