# Cloud deploy helper — run AFTER GitHub push and with provider CLIs logged in
param(
  [ValidateSet("vercel", "railway", "all")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== MyTeam cloud deploy ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prerequisites:"
Write-Host "  1. Neon PostgreSQL -> DATABASE_URL"
Write-Host "  2. Railway: npm i -g @railway/cli && railway login"
Write-Host "  3. Vercel:  npm i -g vercel && vercel login"
Write-Host ""

if ($Target -eq "railway" -or $Target -eq "all") {
  if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI..."
    npm install -g @railway/cli
  }
  railway whoami 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: railway login" -ForegroundColor Yellow
  } else {
    Write-Host "Deploy backend to Railway..."
    Push-Location (Join-Path $Root "backend")
    railway up
    Pop-Location
    Write-Host "Set in Railway dashboard (from .env.production.example):"
    Write-Host "  DATABASE_URL, JWT_SECRET, FRONTEND_URL, SMTP_*, STRIPE_*"
  }
}

if ($Target -eq "vercel" -or $Target -eq "all") {
  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..."
    npm install -g vercel
  }
  vercel whoami 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: vercel login" -ForegroundColor Yellow
  } else {
    Write-Host "Deploy frontend to Vercel..."
    Push-Location (Join-Path $Root "frontend")
    vercel --prod
    Pop-Location
    Write-Host "Set VITE_API_URL to your Railway API URL in Vercel env."
  }
}

Write-Host ""
Write-Host "See DEPLOY.md for full checklist."
