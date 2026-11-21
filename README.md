# PRINCIPIA • PHYSICS OLYMPIAD

## PRINCIPIA Desktop (Windows)

The existing Cloudflare Pages website remains the web version. The Electron desktop shell loads that same site and adds a local Chromium view for AI websites that are known to refuse iframe embedding.

### Run locally

```bash
npm install
npm start
```

### Build the Windows installer

```bash
npm install
npm run dist:win
```

The installer is written to `dist/`.

### Hybrid browser behavior

- Normal sites continue to use the existing in-page iframe.
- Known iframe-blocking AI sites (ChatGPT, Claude, Gemini, and Microsoft Copilot) open in an Electron-managed Chromium view positioned over the mini-browser content area.
- The desktop browser uses its own persistent app session (`persist:principia-ai-browser`); it does not reuse Chrome/Edge cookies.
- Closing or leaving the mini-browser view removes the embedded browser view.

Some sites may still restrict sign-in, popups, media, or automated access. The app does not bypass those site restrictions.

### Notes

- The desktop shell is a separate Windows app; the Cloudflare Pages website remains available as before.
- The desktop app currently loads the production PRINCIPIA URL configured in `desktop/main.cjs`.


## V1 LAN test environment

This branch is the isolated V1 test environment. It does not change the production `main` branch or V2.

Run the zero-dependency local network server with Node.js installed:

```bash
npm run lan
```

Open `http://localhost:4173` on the host computer. The terminal also prints the LAN address for other devices on the same private network. Stop the server with Ctrl+C.

Open the lightweight resource archive at `/resource-vault.html`. It stores link metadata in this browser's local storage and supports JSON import/export. To bring existing lesson resources into the LAN copy, export the PRINCIPIA data backup from the original browser and import that JSON in Resource Vault. Do not expose the LAN server on a public network.
