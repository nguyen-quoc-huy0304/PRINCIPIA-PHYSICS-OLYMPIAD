# PRINCIPIA — Polyglot architecture

## Approved runtime languages

| Language | Responsibility |
|---|---|
| C | Stable ABI at native boundaries and small interoperability shims |
| C++17/20 | Native physics kernels and performance-critical simulation |
| Rust | Primary domain core, validation, game rules, robotics, data analysis and browser WebAssembly |
| Go | HTTP API, concurrency-heavy services, build utilities and cross-language contract tests |
| JavaScript | Browser UI orchestration, DOM events, accessibility and calling WebAssembly |
| TypeScript | Typed browser integration only; no duplicate domain or physics implementation |
| HTML/CSS | Document structure, responsive layout, visual styling and animation |

Java, Python, C#, PHP, Ruby, Zig and Fortran are not approved application or build runtimes for this repository. Do not introduce them without an explicit architecture review and measured technical justification.

## Architecture rules

1. Preserve the official PRINCIPIA website, existing UI, content, authentication and working features.
2. New domain rules belong in Rust. Native performance kernels belong in C/C++; expose stable C ABI functions where needed.
3. Browser physics and scientific computation must call the Rust WebAssembly package first. JavaScript is an adapter and must not become a second physics engine.
4. Go owns HTTP services and integration boundaries. The Go API delegates domain computation to the Rust core; it must not duplicate physics formulas.
5. JavaScript remains only where the browser platform requires it: DOM, UI state, event handling, accessibility, and adapters to WebAssembly or network APIs.
6. HTML and CSS remain the native web presentation technologies. Replacing them with systems languages does not improve browser compatibility.
7. Keep interfaces explicit, validate all external inputs, cap payload sizes, and reject non-finite numerical values.
8. Avoid excessive FFI/process crossings. Batch numerical work and serialize only at service boundaries.
9. Do not claim a migration or performance improvement until the code is integrated and measured on target devices.
10. Do not add Java/Python/.NET runtimes or tools to application, CI, packaging or deployment workflows.
11. One official PRINCIPIA website only. Unit tests, CI and local profiling are allowed; do not create a parallel production site.
12. Scientific modules must document SI units, assumptions, tolerances, edge cases and independent reference tests.

## Migration acceptance

- New/changed core logic is implemented in Rust/C/C++/Go as appropriate.
- Browser physics uses Rust WASM before any fallback.
- Tests cover valid values, invalid values, overflow, boundaries and cross-language parity.
- The browser bridge has a safe error path and does not block the UI thread.
- Build workflows do not install unrelated language runtimes.
- Existing features remain accessible after migration.
