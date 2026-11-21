# PRINCIPIA V2 — native rebuild

V2 is being developed on the isolated `rebuild-v2` branch. The production `main` branch is intentionally untouched until the new app reaches feature parity and passes device testing.

## Architecture
- **Web UI:** Preact + TypeScript + Vite, with a desktop sidebar layout and a separate mobile bottom-navigation layout.
- **Desktop/mobile shell:** Tauri 2 + Rust.
- **Physics:** Rust native calculations with TypeScript fallbacks; C++/WASM is reserved for workloads proven faster by benchmarks.
- **Identity and data:** Firebase Authentication and Firestore with security rules.
- **Local files:** IndexedDB for the account-scoped document library; localStorage for small per-account settings and drafts.

## Implemented in V2 so far
- Firebase email/password and Google redirect sign-in, password reset, visibility toggle, welcome screen, and verified-email admin role hint.
- Original circular PRINCIPIA logo is reused; it is not redrawn.
- Responsive web shell with bottom navigation on mobile.
- Native lesson/course browsing and administrator lesson/folder editor.
- Admin question-bank editor with JSON authoring and validated answer keys for single choice, true/false, multiple choice and short answer; long answers are explicitly marked for teacher review rather than being auto-scored.
- Lesson video playback, personal notes, local lesson attachments, PhET simulation embed.
- Transcript editing, OCR of uploaded local video frames using Tesseract.js, editable OCR text, quick transcript summary, browser speech playback, MyMemory transcript translation, and an AI-assisted translation prompt.
- Account-scoped AI prompt history, built-in AI providers, and custom external AI links. AI responses are still handled by the selected provider's website; V2 does not pretend to run a model locally or call a provider API.
- Music & Focus workspace with Spotify/YouTube/SoundCloud embeds, custom music sites, focus mode and Pomodoro timer.
- Mini browser with URL validation, navigation history, sandboxed frames and external-open fallback.
- Custom game-platform hub with Chess.com, Lichess, Sudoku, GeoGuessr and user-added links.
- Rust-backed kinematics, kinetic-energy and projectile calculators in the native Tauri app, with matching TypeScript browser fallbacks.
- Account profile editor and local light/dark theme preference.
- Multi-platform download center that clearly marks V2 packages as unreleased until signed builds exist.
- Account-scoped offline document library with PDF/image/video/audio preview and download.
- Learning completion, quiz history, EXP, daily streak and achievement badges; account-scoped progress is merged with Firestore without mixing guest and signed-in sessions.
- Private per-account backup/restore, admin publishing of shared lesson and quiz data, and automatic retrieval of published content for signed-in learners.
- Rust physics core and TypeScript fallback; CI checks the web build and Rust code.

## Access model
- Only the verified account `huyquocnguyen03042011@gmail.com` receives the admin role hint.
- Published lessons, quiz banks and media are admin-write-only in `firestore.rules`.
- Each signed-in learner can read published academic content and write only their own private backup/progress documents.
- The role shown in the UI is not a security boundary; Firestore Security Rules must enforce access.

## Important deployment step
`firestore.rules` is a proposal in this repository and **has not been deployed** to Firebase. Review it against the live database's existing collections before deploying. Until the matching rules are deployed, cloud publishing, backup and per-user progress sync may be denied or behave differently from the local app.

## Still being migrated / verified
- Full native parity for every old screen and interaction; the legacy iframe is only a temporary compatibility bridge and must be removed after migration.
- Full video workspace, robust automatic transcript translation, live speech recognition, teacher submission/review workflow, and cloud-backed document storage.
- Direct AI API integrations (which require provider API keys and secure server-side handling); current AI chat opens an external provider and copies the prompt.
- Companion characters and sticker studio (waiting for the complete user-supplied character pack), game stats/achievements, and remaining legacy account/settings tools.
- Cross-device and offline conflict tests, browser/device end-to-end tests, performance benchmarks on real hardware.
- Signed desktop installers and Android/iOS packages, auto-update signing configuration, and store distribution setup.

## Local development
```sh
npm install
npm run dev
npm run build
```

For the desktop shell, install Rust stable and the platform prerequisites, then run `npm run tauri dev` or `npm run tauri build`.

For mobile development, install the Android SDK/NDK and Java 17 for Android, or Xcode and the iOS toolchain on macOS for iOS:

```sh
npm run tauri:android:init
npm run tauri:android:build
npm run tauri:ios:init
npm run tauri:ios:build
```

Mobile builds still need platform signing and store configuration before they are distributable.

## Release safety
Do not merge V2 into `main`, delete the legacy code, or distribute installers until the feature checklist is complete, the Firebase rules are reviewed/deployed, and Windows, Linux, macOS, Android and iOS builds have been tested on real devices.