# PRINCIPIA Desktop (Windows)

Electron shell loads the existing hosted PRINCIPIA website. The web version remains available and unchanged.

## Build
1. Install Node.js 22 LTS on Windows.
2. Run `npm install`.
3. Run `npm run dist:win`.
4. Find the installer under `dist/`.

GitHub Actions builds the installer on a Windows runner. Download the artifact named `PRINCIPIA-Windows-Installer` from the workflow run.

Music Island uses Electron Chromium webview in the desktop app. Some services may still require sign-in, regional availability, or playback permissions. The normal website continues to use iframe restrictions.
