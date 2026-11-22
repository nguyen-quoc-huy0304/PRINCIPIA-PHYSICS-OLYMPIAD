# PRINCIPIA — Performance and resource budget

This is a target and measurement policy, not a claim that every target has already been achieved.

## Product goals

- Keep the existing PRINCIPIA website and application features; do not rebuild from scratch.
- Support constrained devices and treat roughly 1 GB RAM as a design stress target, not a promise that every feature can run simultaneously on every 1 GB device.
- Keep the initial learning/home experience responsive before loading optional labs, simulations, games or AI providers.
- Load large AI models, simulation iframes and optional engines only when the user explicitly opens the relevant feature.
- Stop or suspend nonessential animation, polling, audio/video and background work when a page is hidden.

## First optimization now in the app

The code-learning PhET/lab tab now loads its optional modules on demand:
1. `physics-engine.js`
2. `principia-external-labs.js`
3. `principia-robotics-lab.js`
4. `principia-data-lab.js`

The modules are loaded sequentially through `PrincipiaPerformance.loadScripts()`, only when `switchClLeftTab('phet')` is selected. The PhET iframe no longer receives its initial source at page parse time; the selected simulation is assigned after the lab tab is opened and its loader is ready.

This reduces initial network requests, JavaScript parsing/evaluation and third-party iframe startup work. The exact savings must be measured in a browser on target devices; no numerical improvement is claimed yet.

The lab loader also has a sequential fallback if the optional performance helper is unavailable, so an optimization helper failure does not make the lab feature inaccessible. The idle queue drains within the browser's idle budget; browsers without `requestIdleCallback` run one queued task per fallback turn to avoid draining a large queue in a single long task.

## Language selection

- Rust remains the default safe core.
- C/C++ remain specialized native/WASM kernels.
- Zig may be evaluated for small native/WASM modules with clear binary-size or performance benefits.
- Fortran may be evaluated for substantial numerical workloads where array-oriented libraries help.
- Go and C# remain CI/test tools unless a real product service requires them.
- Do not replace existing Java/Python code merely because of its language. Profile first; move only a proven hot path or unwanted runtime dependency.
- Keep CSS for browser presentation. Optimize layout, style recalculation and paint; replacing CSS with a systems language is not a sensible general strategy.

## Measurement checklist

For each meaningful release, measure on representative desktop, mid-range mobile and constrained/low-memory devices:

- cold and warm startup time;
- total JavaScript transferred, parsed and evaluated before the first interaction;
- peak and steady-state memory/RAM;
- CPU use while idle and during a simulation;
- long main-thread tasks (over 50 ms), input latency and dropped frames;
- simulation throughput and numerical error against reference cases;
- native/WASM binary size and startup overhead;
- cost of FFI/process boundaries and data copying.

Compare the same workload, data and device before/after a change. A language switch is accepted only if it improves measured performance, memory, safety or maintainability without reducing correctness.

## CI

The native-core workflow includes syntax checks for the key browser modules with Node.js. Rust, C++, Go and C# checks are separate jobs so failures can be isolated. A green syntax check is not a browser integration test; browser behavior still requires device/browser testing.

## Non-negotiable

One official PRINCIPIA website only. CI, unit tests and local profiling are allowed; do not create a separate test/preview website or parallel deployment.
