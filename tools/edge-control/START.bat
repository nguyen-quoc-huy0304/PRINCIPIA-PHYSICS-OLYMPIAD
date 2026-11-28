@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON=py -3"
) else (
    where python >nul 2>nul
    if errorlevel 1 (
        echo Python 3.10+ was not found. Install it from https://www.python.org/downloads/windows/
        pause
        exit /b 1
    )
    set "PYTHON=python"
)
echo Checking Python...
%PYTHON% -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)"
if errorlevel 1 (
    echo Python 3.10 or newer is required.
    pause
    exit /b 1
)
echo Installing required Python package...
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 (
    echo Could not install dependencies. Check your internet connection and try again.
    pause
    exit /b 1
)
echo Starting PRINCIPIA Browser Control...
%PYTHON% server.py
if errorlevel 1 (
    echo Browser Control stopped with an error.
    pause
    exit /b 1
)
pause
