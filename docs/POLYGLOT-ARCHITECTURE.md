# PRINCIPIA — Polyglot architecture and language policy

This policy applies to future development. It does not require rewriting the existing application or replacing working code just to change languages.

## Language selection

| Language | Preferred use | Policy |
|---|---|---|
| C | Stable ABI and FFI declarations | Small boundary layer; no duplicate business logic |
| C++17/20 | Performance-sensitive native kernels, simulation, reusable WASM code | Use only where profiling justifies it |
| Rust | Default for new core logic, safe concurrency, validation, native services | Keep existing modules; do not rewrite working code |
| Go | Small network services, concurrency-heavy tools, integration/contract tests | Prefer when simpler deployment and fast iteration matter |
| C#/.NET | Desktop/system integration, independent numerical test oracles, tooling | Do not add to end-user runtime unless needed |
| Zig | Small native utilities, predictable low-level modules, C interop, WASM/native experiments | Evaluate with a prototype and benchmarks before adopting broadly |
| Fortran | Numerical/scientific kernels where mature numerical libraries or array computation provide a clear advantage | Isolate behind C ABI; use only for measured scientific workloads |
| Java | Existing integrations that already require it | Avoid introducing new Java runtime dependencies without a clear need |
| Python | Offline research, data preparation, one-off tooling and reference experiments | Keep out of latency-sensitive app runtime; do not rewrite existing tools without evidence |
| CSS | Existing web presentation layer | Keep for layout and visual styling; CSS is not a general-purpose runtime language and replacing it does not inherently improve performance |

## Architecture rules

1. Preserve the current PRINCIPIA website, UI, content, authentication and working features. No rewrite from scratch.
2. Choose a language per module based on workload, safety, available libraries, deployment size and measured performance.
3. Keep module boundaries explicit. Prefer a stable C ABI or documented JSON-lines protocol for cross-language calls.
4. Avoid excessive FFI crossings and tiny calls across processes; batch work where possible.
5. Rust remains the default safe core. C/C++/Zig/Fortran are specialized tools, not automatic replacements.
6. Fortran and Zig must first pass a small prototype, correctness tests, dependency/license review and benchmark against the existing implementation before production adoption.
7. Do not claim a language is faster without measuring the same workload on the target platform.
8. Avoid adding Java/Python to the end-user runtime for performance-critical paths. Existing Java/Python code is not automatically deleted; replace only when profiling shows a real bottleneck and a safe migration path exists.
9. CSS remains the normal browser styling technology. Optimize critical CSS, layout and rendering rather than replacing CSS with a systems language.
10. Keep Go and C# test tools in CI only unless a product feature genuinely requires them.
11. Tests run against the same source repository and production application code. Do not create extra websites, preview sites or parallel V1/V2 deployments.
12. Scientific modules must document units, assumptions, numerical tolerances, edge cases and independent reference tests. No promise of absolute accuracy.

## Adoption checklist for each new module

- Define its workload and expected performance requirement.
- Prototype against the existing Rust/C++ baseline.
- Test correctness, invalid inputs, numerical stability and portability.
- Benchmark on target devices, including low-memory devices.
- Measure binary size, memory use, startup time and FFI/process overhead.
- Review licenses and dependency maintenance.
- Adopt only if the result is measurably better or materially easier to maintain.
- Document the interface and keep a tested fallback where practical.
