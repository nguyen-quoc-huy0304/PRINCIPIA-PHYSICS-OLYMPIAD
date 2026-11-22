# PRINCIPIA — Rust-first rebuild

## Non-negotiable migration rule
The rebuild must preserve every existing user-facing capability and stored user data. The legacy V1 implementation remains available as a reference/rollback until each feature has a replacement and parity checks pass. Do not delete legacy modules merely because a new module exists.

## Runtime split
- **Rust is the primary language** for domain logic, authorization, persistence contracts, orchestration, and performance-sensitive background work.
- **C++ is the specialist simulation language** for compute-heavy numerical kernels and advanced Virtual Lab solvers.
- TypeScript/JavaScript remains a thin presentation and browser-compatibility layer. It must not become the primary business-logic layer.
- WebAssembly is an optional bridge for browser builds; native desktop/mobile builds should call native Rust/C++ where supported.

## Feature parity inventory
The Rust feature inventory in `rust/src/features.rs` is the migration checklist. It includes authentication, lessons, documents, e-books, video/OCR/translation/speech, quizzes, assignment submission and grading, AI assistant/chat, unified Virtual Lab across physics/chemistry/biology/astronomy/engineering, What-If experiments, experiment builder, graphs/reports, progress/XP/leaderboard, companion characters, notifications, embedded browser, downloads/updater, sync, accessibility, and responsive UI.

## Migration gates
A feature is considered migrated only when:
1. Its old behavior and data formats have been documented.
2. The Rust domain/service implementation and required platform adapter exist.
3. Existing user data is readable and has a tested migration path.
4. Owner/viewer permissions are enforced by the service, not just hidden buttons.
5. Desktop, mobile, and web behavior has parity tests.
6. The feature has been exercised in an integrated build.

## Security
The owner account is the sole editor. All other signed-in accounts are viewers for content administration. Authentication tokens and provider secrets must never be committed to the repository. The client-side role check is only a UI convenience; server-side rules remain authoritative.

## Explicit exclusions
No Giveaway feature. Do not invent replacement branding; retain the supplied PRINCIPIA logo. Do not change Firebase security rules as part of this rebuild without explicit authorization.
