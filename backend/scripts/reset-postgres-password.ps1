# Run as Administrator: Right-click PowerShell -> Run as administrator
# Then: cd C:\MTclone\backend\scripts
#       .\reset-postgres-password.ps1

$ErrorActionPreference = "Stop"

$pgHba = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$psql  = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$service = "postgresql-x64-18"
$newPassword = "16081975"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $pgHba)) {
    Write-Host "ERROR: pg_hba.conf not found at $pgHba" -ForegroundColor Red
    exit 1
}

$backup = "$pgHba.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $pgHba $backup
Write-Host "Backup: $backup"

$content = Get-Content $pgHba -Raw
$trust = $content -replace "scram-sha-256", "trust"
Set-Content -Path $pgHba -Value $trust -NoNewline

Write-Host "Restarting PostgreSQL..."
Restart-Service $service
Start-Sleep -Seconds 3

Write-Host "Setting postgres password..."
& $psql -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"

Write-Host "Creating database myteam if missing..."
& $psql -U postgres -h localhost -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'myteam'" | ForEach-Object {
    if ($_.Trim() -ne "1") {
        & $psql -U postgres -h localhost -d postgres -c "CREATE DATABASE myteam;"
    }
}

Write-Host "Restoring pg_hba.conf..."
Copy-Item $backup $pgHba -Force
Restart-Service $service
Start-Sleep -Seconds 2

Write-Host "Testing login..."
$env:PGPASSWORD = $newPassword
& $psql -U postgres -h localhost -d myteam -c "SELECT 'OK' AS status;"

Write-Host ""
Write-Host "Done. Now run:" -ForegroundColor Green
Write-Host "  cd C:\MTclone\backend"
Write-Host "  npm run migrate"
Write-Host "  npm run dev"
