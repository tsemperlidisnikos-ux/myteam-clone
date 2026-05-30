# Complete production DB setup (migrate + seed + Vercel redeploy)
param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendUrl = "https://backend-sigma-six-35.vercel.app"
$FrontendUrl = "https://frontend-nine-zeta-f5xz9ekez5.vercel.app"

if ($DatabaseUrl -notmatch "sslmode") {
  if ($DatabaseUrl -match "\?") { $DatabaseUrl += "&sslmode=require" }
  else { $DatabaseUrl += "?sslmode=require" }
}

Write-Host ""
Write-Host "=== Production DB Setup ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Running migrations locally..." -ForegroundColor Yellow
$env:DATABASE_URL = $DatabaseUrl
Push-Location (Join-Path $Root "backend")
npm run migrate
if (-not $SkipSeed) {
  Write-Host "[2/4] Seeding production club + admin..." -ForegroundColor Yellow
  npm run seed:production
} else {
  Write-Host "[2/4] Skipping seed (-SkipSeed)" -ForegroundColor DarkGray
}

Write-Host "[3/4] Adding DATABASE_URL to Vercel..." -ForegroundColor Yellow
echo $DatabaseUrl | vercel env rm DATABASE_URL production -y 2>$null
echo $DatabaseUrl | vercel env add DATABASE_URL production

Write-Host "[4/4] Redeploying backend..." -ForegroundColor Yellow
vercel deploy --prod
Pop-Location

Write-Host ""
Write-Host "Checking health..." -ForegroundColor Yellow
Start-Sleep -Seconds 8
try {
  $health = Invoke-RestMethod -Uri "$BackendUrl/health" -TimeoutSec 30
  if ($health.db -eq "connected") {
    Write-Host "DB connected!" -ForegroundColor Green
  } else {
    Write-Host "Health response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Yellow
  }
} catch {
  Write-Host "Health check pending (cold start). Try: $BackendUrl/health" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== LIVE ===" -ForegroundColor Green
Write-Host "  Web:    $FrontendUrl"
Write-Host "  API:    $BackendUrl"
Write-Host "  Health: $BackendUrl/health"
Write-Host ""
Write-Host "  Login:  nikos.tseberlidis@gmail.com / 123456"
Write-Host "  Club:   PROMITHEAS BC"
Write-Host ""
