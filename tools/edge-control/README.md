# PRINCIPIA Browser Control (Python)

Local Windows dashboard for controlling a dedicated Microsoft Edge profile.

## Requirements
- Windows 10/11
- Microsoft Edge
- Python 3.10 or newer

## Run
1. Install Python from https://www.python.org/downloads/windows/ and enable **Add Python to PATH**.
2. Open PowerShell in this folder.
3. Run:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\start.ps1
   ```
4. The launcher installs the Playwright Python package and opens Edge at http://127.0.0.1:4317.
5. Press Ctrl+C in PowerShell to stop.

## Features
- Open, inspect, reload and close tabs.
- Read page text and links.
- Click elements and fill inputs using CSS selectors.
- Capture screenshots.
- Read Console errors, page errors and failed requests.

## Security
- Server binds only to 127.0.0.1:4317.
- API requests require a random per-run token.
- Host and Origin are checked.
- Navigation accepts only HTTP/HTTPS URLs.
- No arbitrary JavaScript execution API is exposed.
- Uses a separate persistent Edge profile at %LOCALAPPDATA%\\PRINCIPIA\\EdgeControlProfile.

## Tests
Run `py -3 -m unittest discover -s tests -v`.
