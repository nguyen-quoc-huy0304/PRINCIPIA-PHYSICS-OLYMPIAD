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
