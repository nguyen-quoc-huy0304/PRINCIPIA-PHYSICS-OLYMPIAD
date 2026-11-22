# PRINCIPIA — Rust-first rebuild

## Language boundary
- **Rust** owns application/domain logic: identity-to-role policy, content catalog, assessment, progress, persistence contracts, navigation state, synchronization contracts and validation.
- **C++17** is reserved for performance-sensitive numerical kernels and simulation engines. It is not used for routine UI or business rules.
- HTML/CSS/JavaScript are a presentation/platform adapter only. They must not become a second source of truth for permissions, scoring or academic progress.

## Feature parity inventory
The rebuild must preserve the existing product surface: authentication (Google and email/password, reset and visibility toggle), learner profile, courses/lessons, notes, documents/e-books, video and transcript/OCR tools, translation and speech, quizzes, assignments and grading hand-off, AI assistant hand-off and per-provider chat history, Virtual Labs (physics/chemistry/biology/astronomy/engineering), What-if scenarios, experiment builder, charts/exports, progress/XP/streak/leaderboards, companion events, notifications, embedded browser, downloads, updater, synchronization, accessibility, desktop/mobile layouts and platform packaging.

## Migration rules
1. Keep the current application and user data readable while each feature is migrated.
2. Move domain rules into Rust before replacing the corresponding legacy UI.
3. Give each migrated feature a compatibility adapter and tests.
4. Do not delete legacy assets or user data until parity is verified and a rollback is available.
5. Build platform shells only after web core and native tests pass.

## Security
The configured owner identity is `huyquocnguyen03042011@gmail.com`. All other authenticated identities are viewers. UI checks are not security boundaries; production write APIs must independently verify signed identity tokens and enforce the same Rust policy on the server.
