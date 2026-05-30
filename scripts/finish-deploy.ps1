# Finish production deploy — adds DATABASE_URL after Neon/Render DB is ready
param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendUrl = "https://backend-sigma-six-35.vercel.app"
$FrontendUrl = "https://frontend-nine-zeta-f5xz9ekez5.vercel.app"

if ($DatabaseUrl -notmatch "sslmode") {
  if ($DatabaseUrl -match "\?") { $DatabaseUrl += "&sslmode=require" }
  else { $DatabaseUrl += "?sslmode=require" }
}

Write-Host "Adding DATABASE_URL to Vercel backend..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "backend")
echo $DatabaseUrl | vercel env rm DATABASE_URL production -y 2>$null
echo $DatabaseUrl | vercel env add DATABASE_URL production
Write-Host "Redeploying backend..." -ForegroundColor Cyan
vercel deploy --prod
Pop-Location

Write-Host "Running migrations..." -ForegroundColor Cyan
$env:DATABASE_URL = $DatabaseUrl
Push-Location (Join-Path $Root "backend")
npm run migrate
Pop-Location

Write-Host ""
Write-Host "=== LIVE ===" -ForegroundColor Green
Write-Host "  Web:  $FrontendUrl"
Write-Host "  API:  $BackendUrl"
Write-Host "  Health: $BackendUrl/health"
Write-Host ""
Write-Host "Login with your local demo account after seed, or register a new club."
