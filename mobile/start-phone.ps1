# MyTeam Mobile — start για κινητό (ίδιο Wi‑Fi)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.PrefixOrigin -ne 'WellKnown'
} | Select-Object -First 1).IPAddress

if (-not $ip) { $ip = "192.168.2.19" }

Write-Host "PC IP: $ip"
Write-Host "API URL: http://${ip}:5000"
Write-Host ""

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_URL = "http://${ip}:5000"

Set-Location $PSScriptRoot
npx expo start --lan --clear
