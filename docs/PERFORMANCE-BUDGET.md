# PRINCIPIA — Performance and resource budget

This document defines targets and verification rules. It does not claim unmeasured improvements.

## Product goals

- Preserve the existing PRINCIPIA website, UI, content, authentication and working features.
- Treat roughly 1 GB RAM as a constrained-device stress target, not a promise that every feature runs simultaneously.
- Keep the initial learning/home experience responsive before loading optional labs, simulations, games or AI providers.
- Load large AI models, simulations and optional engines only when the user opens the relevant feature.
- Suspend nonessential animation, polling, audio/video and background work when a page is hidden.

## Runtime language boundaries

- Rust is the primary domain and numerical core.
- C/C++ provide native physics kernels and stable ABI boundaries.
- Rust WebAssembly is the browser computation backend; JavaScript coordinates UI and WASM calls.
- Go owns HTTP services and build utilities; the API gateway delegates domain computation to the Rust core.
- JavaScript remains for browser UI, DOM events, accessibility and network/WASM adapters.
- HTML/CSS remain the browser presentation layer.
- Do not add Java, Python, .NET, Zig or Fortran runtimes to application, CI, packaging or deployment workflows.

## Existing loading optimization

The code-learning PhET/lab tab loads optional modules on demand:
1. `physics-engine.js`
2. `principia-external-labs.js`
3. `principia-robotics-lab.js`
4. `principia-data-lab.js`

The modules load sequentially after the lab tab is selected. The PhET iframe receives its source only after the loader is ready. This reduces initial requests and startup work; exact savings must be measured on target devices.

## Measurement checklist

For each meaningful release, measure on representative desktop, mid-range mobile and constrained devices:

- cold and warm startup time;
- JavaScript transferred, parsed and evaluated before first interaction;
- peak and steady-state memory;
- CPU while idle and during simulation;
- long main-thread tasks, input latency and dropped frames;
- simulation throughput and numerical error against reference cases;
- native/WASM binary size and startup overhead;
- FFI/process overhead and data copying.

Compare the same workload, data and device before and after each change. A language migration is accepted only when it improves measured performance, memory, safety or maintainability without reducing correctness.

## CI

Rust tests and WebAssembly compilation validate the numerical core. C/C++ tests validate native kernels. Go tests validate service and protocol boundaries. Node.js syntax and unit tests validate the browser adapter and UI integration. A green syntax check is not a browser integration test; target-browser testing is still required.

## Non-negotiable

One official PRINCIPIA website only. CI, unit tests and local profiling are allowed; do not create a parallel production, test or preview website.
