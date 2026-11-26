#ifndef PRINCIPIA_PHYSICS_ENGINE_H
#define PRINCIPIA_PHYSICS_ENGINE_H

/* Stable C ABI shared by the C++ kernel, Rust FFI and native test runners.
 * All physical quantities use SI units unless a parameter says angleDeg.
 * Invalid domains return NaN; callers must check finiteness.
 */
#ifdef __cplusplus
extern "C" {
#endif

int principia_validate_inputs(double a, double b, double c);
double principia_velocity(double initial_mps, double acceleration_mps2, double seconds);
double principia_displacement(double initial_mps, double acceleration_mps2, double seconds);
double principia_kinetic_energy(double mass_kg, double speed_mps);
double principia_projectile_range(double speed_mps, double angle_deg, double gravity_mps2);
double principia_projectile_max_height(double speed_mps, double angle_deg, double gravity_mps2);
/* Samples a projectile trajectory into caller-owned x/y arrays. Returns samples written, or 0 on invalid input. */
int principia_projectile_trajectory(double speed_mps, double angle_deg, double gravity_mps2, double duration_s, int sample_count, double *x_m, double *y_m);

#ifdef __cplusplus
}
#endif
#endif
