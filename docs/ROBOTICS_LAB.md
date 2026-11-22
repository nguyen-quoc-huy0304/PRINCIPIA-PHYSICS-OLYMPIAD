# PRINCIPIA Robotics Lab

## Two-link planar arm (2R)

The lab solves the inverse kinematics of a planar two-revolute-joint arm.

- Inputs: link lengths L1/L2 and target point (x, y), all in metres.
- Output: shoulder and elbow joint angles in radians and degrees, reconstructed end-effector position, geometric residual, and a singularity flag.
- Elbow branch: +1 selects the positive-elbow solution; -1 selects the negative-elbow solution.
- Reachability: the target radius must satisfy |L1-L2| <= sqrt(x^2+y^2) <= L1+L2, within a small floating-point tolerance.
- Desktop: request is dispatched through the Rust sidecar to `rust/src/robotics.rs`.
- Browser: the same closed-form equations run as an analytical fallback.

The solver reports the geometric reconstruction residual. It does not represent actuator accuracy or physical tracking error.

## Model limitations

This is kinematics, not a full robot dynamics or safety controller. It does not model link mass/inertia, motor torque, joint limits, friction, compliance, collision avoidance, calibration, or sensor uncertainty. Do not connect it to real hardware or use its result as a safety-critical command.

## Verification cases

The Rust module includes tests for both elbow branches, forward/inverse round-trip consistency, unreachable targets, invalid link lengths, and the fully extended singular configuration. GitHub Actions status must be checked separately; the presence of tests does not mean they have passed in CI.
