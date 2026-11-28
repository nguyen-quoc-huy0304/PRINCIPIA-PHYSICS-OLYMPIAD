$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) {
    $pythonCommand = "py"
    $pythonArgs = @("-3")
} else {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) {
        Write-Host "Can cai Python 3.10 tro len: https://www.python.org/downloads/windows/" -ForegroundColor Red
        Write-Host "Khi cai dat, hay danh dau Add Python to PATH."
        exit 1
    }
    $pythonCommand = "python"
    $pythonArgs = @()
}

$version = & $pythonCommand @pythonArgs -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$parts = $version.Split('.')
if ([int]$parts[0] -lt 3 -or ([int]$parts[0] -eq 3 -and [int]$parts[1] -lt 10)) {
    Write-Host "Can Python 3.10 tro len. Phien ban hien tai: $version" -ForegroundColor Red
    exit 1
}

Write-Host "Python $version"
Write-Host "Dang cai Playwright Python..."
& $pythonCommand @pythonArgs -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Dang kiem tra Microsoft Edge..."
& $pythonCommand @pythonArgs -c "from pathlib import Path; import os,sys; p=[os.environ.get('EDGE_PATH'),str(Path(os.environ.get('PROGRAMFILES(X86)','C:/Program Files (x86)'))/'Microsoft/Edge/Application/msedge.exe'),str(Path(os.environ.get('PROGRAMFILES','C:/Program Files'))/'Microsoft/Edge/Application/msedge.exe'),str(Path(os.environ.get('LOCALAPPDATA',''))/'Microsoft/Edge/Application/msedge.exe')]; sys.exit(0 if any(x and Path(x).is_file() for x in p) else 1)"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Khong tim thay Microsoft Edge. Hay cai Edge truoc." -ForegroundColor Red
    exit 1
}

& $pythonCommand @pythonArgs server.py
exit $LASTEXITCODE
