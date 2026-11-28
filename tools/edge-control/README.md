# PRINCIPIA Edge Control

Local Windows dashboard for controlling a dedicated Microsoft Edge profile during PRINCIPIA development and QA.

## Features
- Launches Microsoft Edge with a persistent PRINCIPIA-only profile.
- Open URLs and list/close tabs.
- Read page title, URL, visible text, and up to 100 links.
- Click elements and fill inputs using CSS selectors.
- Capture viewport screenshots.
- Read Console errors, page errors, and failed network requests.
- Localhost-only API, per-run random session token, same-origin checks, input validation.

## Requirements
- Windows 10/11
- Microsoft Edge
- Node.js 20 or newer

## Run
1. Download or clone the repository.
2. Open PowerShell in tools/edge-control.
3. Run:
   powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\start.ps1
4. Open http://127.0.0.1:4317 if it does not open automatically.
5. Use the Edge window launched by the tool. Sign in to test accounts manually.
6. Press Ctrl+C in the terminal to stop the tool and its Edge session.

The first run installs dependencies. The browser profile is stored in %LOCALAPPDATA%\PRINCIPIA\EdgeControlProfile and persists between runs.

## Browser profile
For security and stability, the tool does not attach to the default personal Edge profile that may already be open. It launches a separate Edge profile dedicated to PRINCIPIA automation. Sign in to sites in that Edge window; cookies remain in that profile for later runs.

## Safety
- Server binds only to 127.0.0.1:4317.
- API calls require a random token held by the local dashboard.
- Only HTTP/HTTPS navigation is accepted.
- No arbitrary JavaScript execution endpoint is exposed.
- Form submission, purchases, publishing, and other consequential actions are not automated.
- Do not expose port 4317 to a LAN or the public internet.

## Tests
Run npm test in this directory. Tests cover URL scheme validation, host restrictions, and same-origin validation.
