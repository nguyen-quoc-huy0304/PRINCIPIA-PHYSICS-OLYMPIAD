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

## Run automated JavaScript tests

```bash
npm test
```

This runs the local Node.js test suite in `tests/js/`. The same suite is also run by the GitHub Actions core-checks workflow.

## Native Go + Rust + C++ compute service

The browser uses the same-origin `POST /api/compute` and `POST /api/game/trajectory` Cloudflare Pages Functions. Set the Pages environment variable `PRINCIPIA_GO_API_URL` to the HTTPS base URL of the Go service. The proxy validates the request shape and forwards supported operations to the Go API; the Go API invokes the Rust JSON-line core, which uses the C++ numerical kernel for supported physics operations. If the service is not configured or unavailable, the browser continues with its Rust/WASM core.

Build the service image from the repository root:

```bash
docker build -f services/go-api/Dockerfile -t principia-native-api .
docker run --rm -p 8080:8080 principia-native-api
```

The container exposes `GET /healthz` and `POST /v1/compute`. Configure `PRINCIPIA_CORE_BIN` and `ALLOWED_ORIGIN` only when running the Go service outside the provided container. The Cloudflare Pages Function requires `PRINCIPIA_GO_API_URL`; no API secret is exposed to browser code.
