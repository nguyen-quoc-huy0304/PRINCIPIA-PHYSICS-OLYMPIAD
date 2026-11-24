# Third-party notices

## Rapier 3D

- Component: `rapier3d` Rust crate, version `0.36.1`
- Copyright: Dimforge contributors
- License: Apache License 2.0
- Upstream source: https://github.com/dimforge/rapier
- Official documentation: https://rapier.rs/docs/
- Integrated in PRINCIPIA through the Rust rigid-body lab adapter at `rust/src/rigid_body.rs`.
- PRINCIPIA's adapter is separate from Rapier's upstream source. The analytical formula solvers in `rust/src/physics.rs` remain the reference for closed-form textbook problems; Rapier is used for collisions and time-stepped rigid-body dynamics.

The full upstream Apache-2.0 license text is preserved in `third_party/licenses/RAPIER-APACHE-2.0.txt`.

## CircuitJS1 (embedded service)

- Component: CircuitJS1 browser circuit simulator by Paul Falstad and Iain Sharp.
- License: GNU GPL version 2 or (at your option) any later version (GPL-2.0-or-later).
- Upstream source: https://github.com/pfalstad/circuitjs1
- Hosted simulator: https://www.falstad.com/circuit/
- PRINCIPIA currently embeds the upstream hosted simulator in an iframe; it does not redistribute or modify the CircuitJS1 source.
- Educational-use caution: the upstream project notes that some component models are idealized and does not recommend using the simulator as the sole basis for real-circuit design.


## Uiverse button pattern

- Component: layered press-state action button adapted in `assets/css/principia-uiverse-copy.css` and extended by `assets/css/principia-live-ui-adapter.css`.
- Original creator: Web-Potato.
- Upstream source: https://uiverse.io/Web-Potato/silent-ape-24
- License: MIT, as identified by the upstream Uiverse component listing.
- PRINCIPIA retains source attribution in the stylesheet header. The adapter applies the visual interaction to existing primary-action buttons without replacing their labels, event handlers, or DOM structure.

