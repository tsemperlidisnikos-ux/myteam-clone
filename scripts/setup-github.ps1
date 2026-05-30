# Create GitHub repo and push (requires gh auth or GH_TOKEN)
param(
  [string]$RepoName = "myteam-clone",
  [switch]$Public
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Installing GitHub CLI..."
  winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}

if ($env:GH_TOKEN) {
  $env:GH_TOKEN | gh auth login --with-token
}

$authOk = $false
try {
  gh auth status 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $authOk = $true }
} catch {
  $authOk = $false
}

if (-not $authOk) {
  Write-Host ""
  Write-Host "GitHub login required. Run in terminal:" -ForegroundColor Yellow
  Write-Host "  gh auth login -h github.com -p https -w"
  Write-Host "Then re-run: .\scripts\setup-github.ps1"
  exit 1
}

$visibility = if ($Public) { "--public" } else { "--private" }

$hasOrigin = $false
try {
  $null = git remote get-url origin 2>$null
  if ($LASTEXITCODE -eq 0) { $hasOrigin = $true }
} catch {
  $hasOrigin = $false
}

if ($hasOrigin) {
  Write-Host "Remote origin exists - pushing..."
  git push -u origin master 2>$null
  if ($LASTEXITCODE -ne 0) {
    git branch -M main
    git push -u origin main
  }
} else {
  Write-Host "Creating repo $RepoName and pushing..."
  gh repo create $RepoName $visibility --source=. --remote=origin --push
  if ($LASTEXITCODE -ne 0) {
    git branch -M main
    gh repo create $RepoName $visibility --source=. --remote=origin --push
  }
}

$remote = git remote get-url origin
Write-Host ""
Write-Host "GitHub OK: $remote" -ForegroundColor Green
Write-Host "CI will run on push (see .github/workflows/ci.yml)"
