# PRINCIPIA V2 — migration foundation

This folder is an isolated replacement architecture. The current production app remains untouched until parity, data migration, and performance checks pass.

## Stack
- Preact + TypeScript + Vite for a small, code-split web UI.
- Tauri 2 + Rust for desktop/mobile application shells.
- C++ compiled to WebAssembly only for computationally heavy physics workloads.
- Firebase modules imported on demand for auth and cloud data.

## Local development
```sh
npm install
npm run dev
``

## Production build
```sh
npm run build
``

## Desktop
Install Rust stable and platform prerequisites, then:
```sh
npm run tauri dev
npm run tauri build
``

## Migration rules
1. Keep the existing production site and Electron release intact while V2 is developed.
2. Move feature-by-feature; preserve account identity, learning content, quiz banks, notes, progress, and media.
3. Never copy private Firebase credentials or admin secrets into the client. Enforce roles with Firebase Security Rules.
4. Load routes and large features lazily; virtualize long lists; avoid rendering the whole workspace on each state update.
5. Benchmark startup, navigation, memory, and physics calculations on the same devices before/after.
6. Switch production only after feature parity, data migration, auth, and device tests are complete.

## Current status
Foundation only. This is not yet a replacement for the production PRINCIPIA app; legacy features have not yet been migrated.
