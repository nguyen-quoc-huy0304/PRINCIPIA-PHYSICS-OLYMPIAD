# PRINCIPIA — Polyglot architecture

The languages are deliberately assigned different jobs. They are not interchangeable implementations of the same application logic.

| Language | Responsibility | Runtime or test-only |
|---|---|---|
| C | Stable, documented ABI declarations at the native boundary | Interop contract |
| C++17 | Small performance-sensitive scientific kernels and simulation primitives | Native/WASM kernel |
| Rust | Main domain/core logic, validation, permissions, data analysis, robotics, JSON-lines sidecar | Primary application core |
| Go | Cross-process integration tests for the sidecar protocol, malformed requests and API compatibility | Test-only |
| C#/.NET 8 | Independent reference calculations and end-to-end contract checks against the native core | Test-only |

## Data flow

`UI (existing web/desktop shell) → JSON Lines → Rust sidecar → Rust domain modules → C ABI → C++ numerical kernel`

Go and C# tests launch the same compiled Rust sidecar. They do not ship in the user's application and do not create a second website.

## Rules that keep this maintainable

1. Rust owns business rules and validation. Do not duplicate authorization, scoring or persistence logic in Go/C#.
2. C is an ABI boundary, not a second physics implementation. The declarations live in `src/physics/engine.h`.
3. C++ is limited to kernels where native performance or WASM reuse is justified. Every exported function documents SI units and invalid-input behavior.
4. Go checks process/protocol behavior. C# independently checks selected numerical results against simple reference formulas.
5. A test pass is not a proof of absolute scientific accuracy. Use analytical reference cases, tolerances, boundary cases and documented model assumptions.
6. Go and .NET are CI dependencies only; they are not runtime requirements for end users.
7. Keep one PRINCIPIA website. Run CI and local tests against the same source tree; do not create test/preview sites.
