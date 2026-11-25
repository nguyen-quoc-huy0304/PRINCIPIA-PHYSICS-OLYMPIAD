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
typedef struct {
  double v1, v2, momentum_before, momentum_after, momentum_error;
  double kinetic_before, kinetic_after, kinetic_change, energy_loss;
  double restitution, total_mass;
} principia_collision_1d_result;
int principia_collision_1d(double mass_a, double velocity_a, double mass_b,
                           double velocity_b, double restitution,
                           principia_collision_1d_result* output);


#ifdef __cplusplus
}
#endif
#endif
