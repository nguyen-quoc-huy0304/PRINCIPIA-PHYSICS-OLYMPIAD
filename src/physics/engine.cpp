// PRINCIPIA Physics Core — C++17 native/WASM numerical kernel. SI units.
#include "engine.h"
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
PRINCIPIA_EXPORT int principia_projectile_trajectory(double speed, double angle_deg, double gravity, double duration, int count, double* x, double* y) {
  if (!x || !y || count < 2 || count > 1000000 || !finite({speed,angle_deg,gravity,duration}) || speed < 0.0 || gravity <= 0.0 || duration < 0.0) return 0;
  const double rad = angle_deg * PI / 180.0;
  const double vx = speed * std::cos(rad), vy = speed * std::sin(rad);
  for (int i = 0; i < count; ++i) {
    const double t = duration * static_cast<double>(i) / static_cast<double>(count - 1);
    x[i] = vx * t; y[i] = vy * t - 0.5 * gravity * t * t;
    if (!finite({x[i], y[i]})) return 0;
  }
  return count;
}
PRINCIPIA_EXPORT double principia_projectile_max_height(double speed, double angle_deg, double gravity) {
  if (!finite({speed,angle_deg,gravity}) || speed < 0.0 || gravity <= 0.0) return invalid();
  const double vy = speed*std::sin(angle_deg * PI / 180.0);
  return vy*vy/(2.0*gravity);
}
}
