# PRINCIPIA Go API

This service is a small HTTP boundary for the native Rust/C++ computation core. It does not replace Firebase authentication or the existing Cloudflare Pages frontend.

## Run

Build the native core first:

```sh
cargo build --manifest-path rust/Cargo.toml --release --bin principia-core-server
cd services/go-api
PRINCIPIA_CORE_BIN=../../rust/target/release/principia-core-server go run .
```

The service listens on `:8080` by default. Set `ADDR` to change the bind address and `ALLOWED_ORIGIN` to allow one exact browser origin. An empty `ALLOWED_ORIGIN` disables cross-origin browser access.

## Endpoints

- `GET /healthz`: liveness check.
- `POST /v1/compute`: validates a supported operation and forwards the JSON-line contract to the Rust core.
- `POST /v1/ai/generate`: verifies a Firebase ID token, validates bounded chat input, and calls Gemini using server-side credentials.

The compute endpoint limits request bodies to 64 KiB, rejects unknown fields and non-finite numeric values, and applies an eight-second execution deadline. The AI endpoint requires `FIREBASE_WEB_API_KEY` and `GEMINI_API_KEY`; `GEMINI_MODEL` is optional. It validates bearer tokens with Firebase Identity Toolkit, limits requests to 24 KiB and 18 messages, and never forwards identity fields to Gemini. Deploy this service behind HTTPS and set `ALLOWED_ORIGIN` to the exact PRINCIPIA origin. Do not expose provider credentials to the browser.
