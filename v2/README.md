# PRINCIPIA V2 — performance-first migration

This folder is an isolated replacement architecture. The current production app remains untouched until feature parity, data migration, and performance checks pass.

## Runtime architecture
- **Web:** Preact + TypeScript + Vite. Small UI runtime, production minification, split UI/Firebase chunks.
- **Desktop/mobile shell:** Tauri 2 + Rust. The desktop shell renders local bundled assets instead of loading the production website over the network.
- **Native compute:** Rust commands for validated motion, kinetic-energy, and projectile calculations. Web uses equivalent TypeScript fallbacks.
- **Heavy numerical workloads:** C++ compiled to WebAssembly only when profiling shows that it beats the Rust/native or optimized JS path.
- **Identity and sync:** Firebase Auth/Firestore, loaded lazily and protected by server-side Security Rules.

## Performance rules
1. Keep startup code small; dynamically import large screens and optional features.
2. Never load Firebase modules until authentication or cloud data is needed.
3. Cache static assets and user content with explicit versioning; avoid refetching entire app bundles.
4. Keep long lists virtualized and expensive calculations off the UI thread.
5. Use Rust for native work and C++/WASM for measured hot loops, not for ordinary UI.
6. Release builds use optimization level 3, thin LTO, one codegen unit, and stripped symbols.
7. Benchmark cold start, warm start, navigation latency, memory, and representative physics workloads on the same devices.

## Local development
```sh
npm install
npm run dev
```

## Web production build
```sh
npm run build
```

## Desktop development and release
Install Rust stable and platform prerequisites:
```sh
npm run tauri dev
npm run tauri build
```

## Cloud data and access control\n- Legacy local data is exported/imported as JSON and can be synced per account in chunked Firestore documents.\n- `firestore.rules` contains proposed V2 rules: learners read academic content, only the verified admin email can edit content/question banks/media, and each user can sync only their own progress/backup.\n- These rules are **not deployed automatically**. Review the collection names and existing production rules before deploying them in Firebase Console; do not overwrite live rules blindly.\n\n## Migration and data safety
1. Keep the existing production site and Electron release intact while V2 is developed.
2. Migrate account identity, learning content, quiz banks, notes, progress, and media without destructive changes.
3. Never place admin secrets in client code. Enforce the single-admin write policy through Firebase Security Rules.
4. Switch production only after feature parity, auth, data migration, and device tests pass.

## Current status
The V2 foundation now includes modular Firebase sign-in (Google redirect, email/password, password reset), a welcome screen, basic read-only views for legacy lessons/quizzes/progress, local JSON backup/restore, per-account chunked Firestore backup, and native Rust physics commands with TypeScript web fallbacks. The original production logo is reused.\n\nThis is still **not** a full replacement: video/document workspaces, AI chat and tools, full lesson editor/course interactions, all existing companion and game features, and full end-to-end migration/device testing remain to be ported. Firestore rules are provided for review but have not been deployed. No production switch or release package has been made.
