$ErrorActionPreference = "Stop"
$edgeCandidates = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
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
