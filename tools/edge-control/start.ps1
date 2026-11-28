$ErrorActionPreference = "Stop"
$programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
$programFiles = [Environment]::GetEnvironmentVariable("ProgramFiles")
$localAppData = [Environment]::GetEnvironmentVariable("LOCALAPPDATA")
$edgeCandidates = @(
  (Join-Path $programFilesX86 "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path $programFiles "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path $localAppData "Microsoft\Edge\Application\msedge.exe")
) | Where-Object { $_ -and (Test-Path $_) }
$edge = $edgeCandidates | Select-Object -First 1
if (-not $edge) {
  Write-Host "Khong tim thay Microsoft Edge. Hay cai Edge truoc." -ForegroundColor Red
  exit 1
}
$env:EDGE_PATH = $edge
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Can cai Node.js 20 tro len: https://nodejs.org/" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path "node_modules")) {
  Write-Host "Dang cai dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
npm start
