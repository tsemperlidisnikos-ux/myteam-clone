# MyTeam — full local setup (deps, DB, tests)
param(
  [switch]$SkipTests,
  [switch]$StartApp
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== MyTeam setup-all ===" -ForegroundColor Cyan

function Ensure-Env {
  $envPath = Join-Path $Root "backend\.env"
  $example = Join-Path $Root "backend\.env.example"
  if (-not (Test-Path $envPath)) {
    Copy-Item $example $envPath
    Write-Host "Created backend/.env from example"
  }
}

function Npm-Install($dir) {
  Write-Host "npm install: $dir"
  Push-Location (Join-Path $Root $dir)
  if (-not (Test-Path "node_modules")) { npm ci 2>$null; if ($LASTEXITCODE -ne 0) { npm install } }
  else { npm install }
  Pop-Location
}

Ensure-Env
Npm-Install "backend"
Npm-Install "frontend"
Npm-Install "mobile"

Write-Host "Database migrate..."
Push-Location (Join-Path $Root "backend")
npm run migrate
npm run seed:ci
Pop-Location

if (-not $SkipTests) {
  Write-Host "Backend tests..."
  Push-Location (Join-Path $Root "backend")
  npm test
  if ($LASTEXITCODE -ne 0) { throw "Backend tests failed" }
  Pop-Location

  Write-Host "Frontend build..."
  Push-Location (Join-Path $Root "frontend")
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
  Pop-Location
}

Write-Host ""
Write-Host "Setup OK." -ForegroundColor Green
Write-Host "  Web:  http://localhost:5173"
Write-Host "  API:  http://localhost:5000/health"
Write-Host "  Login: nikos.tseberlidis@gmail.com / 123456"

if ($StartApp) {
  & (Join-Path $Root "start.bat")
}
