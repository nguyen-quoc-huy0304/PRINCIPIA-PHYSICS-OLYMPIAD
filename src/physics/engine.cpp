// PRINCIPIA Physics Core — C++17 native/WASM numerical kernel. SI units.
#include "engine.h"
#include <algorithm>
#include <cmath>
#include <initializer_list>
#include <limits>
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define PRINCIPIA_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define PRINCIPIA_EXPORT
#endif
namespace {
constexpr double PI = 3.14159265358979323846;
bool finite(std::initializer_list<double> xs) {
  for (double x : xs) if (!std::isfinite(x)) return false;
  return true;
}
double invalid() { return std::numeric_limits<double>::quiet_NaN(); }
}
extern "C" {
PRINCIPIA_EXPORT int principia_validate_inputs(double a, double b, double c) {
  return finite({a,b,c}) ? 1 : 0;
}
PRINCIPIA_EXPORT double principia_velocity(double u, double a, double t) {
  return finite({u,a,t}) ? u + a*t : invalid();
}
PRINCIPIA_EXPORT double principia_displacement(double u, double a, double t) {
  return finite({u,a,t}) ? u*t + 0.5*a*t*t : invalid();
}
PRINCIPIA_EXPORT double principia_kinetic_energy(double mass, double speed) {
  return finite({mass,speed}) && mass >= 0.0 ? 0.5*mass*speed*speed : invalid();
}
PRINCIPIA_EXPORT double principia_projectile_range(double speed, double angle_deg, double gravity) {
  if (!finite({speed,angle_deg,gravity}) || speed < 0.0 || gravity <= 0.0) return invalid();
  const double rad = angle_deg * PI / 180.0;
  return (speed*std::cos(rad)) * (2.0*speed*std::sin(rad)/gravity);
}
PRINCIPIA_EXPORT double principia_projectile_max_height(double speed, double angle_deg, double gravity) {
  if (!finite({speed,angle_deg,gravity}) || speed < 0.0 || gravity <= 0.0) return invalid();
  const double vy = speed*std::sin(angle_deg * PI / 180.0);
  return vy*vy/(2.0*gravity);
}
PRINCIPIA_EXPORT int principia_collision_1d(double mass_a, double velocity_a,
    double mass_b, double velocity_b, double restitution,
    principia_collision_1d_result* output) {
  if (!output || !finite({mass_a, velocity_a, mass_b, velocity_b, restitution}) ||
      mass_a <= 0.0 || mass_b <= 0.0 || restitution < 0.0 || restitution > 1.0) return 0;
  const double total_mass = mass_a + mass_b;
  const double momentum_before = mass_a * velocity_a + mass_b * velocity_b;
  const double relative_approach = velocity_a - velocity_b;
  const double v1 = (momentum_before - mass_b * restitution * relative_approach) / total_mass;
  const double v2 = (momentum_before + mass_a * restitution * relative_approach) / total_mass;
  const double momentum_after = mass_a * v1 + mass_b * v2;
  const double kinetic_before = 0.5 * mass_a * velocity_a * velocity_a + 0.5 * mass_b * velocity_b * velocity_b;
  const double kinetic_after = 0.5 * mass_a * v1 * v1 + 0.5 * mass_b * v2 * v2;
  const double momentum_error = momentum_after - momentum_before;
  const double kinetic_change = kinetic_after - kinetic_before;
  const double energy_loss = std::max(0.0, kinetic_before - kinetic_after);
  if (!finite({total_mass, momentum_before, relative_approach, v1, v2, momentum_after,
      kinetic_before, kinetic_after, momentum_error, kinetic_change, energy_loss})) return 0;
  *output = {v1, v2, momentum_before, momentum_after, momentum_error,
      kinetic_before, kinetic_after, kinetic_change, energy_loss, restitution, total_mass};
  return 1;
}
}
