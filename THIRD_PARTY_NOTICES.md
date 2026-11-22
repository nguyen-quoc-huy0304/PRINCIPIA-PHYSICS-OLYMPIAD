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
