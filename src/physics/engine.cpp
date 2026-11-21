// PRINCIPIA Physics Core — C++17 / WebAssembly exports. SI units.
#include <cmath>
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define PRINCIPIA_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define PRINCIPIA_EXPORT
#endif
extern "C" {
PRINCIPIA_EXPORT double principia_velocity(double u, double a, double t) { return u + a*t; }
PRINCIPIA_EXPORT double principia_displacement(double u, double a, double t) { return u*t + 0.5*a*t*t; }
PRINCIPIA_EXPORT double principia_kinetic_energy(double mass, double speed) { return 0.5*mass*speed*speed; }
PRINCIPIA_EXPORT double principia_projectile_range(double speed, double angle_deg, double gravity) {
  const double rad = angle_deg * 3.14159265358979323846 / 180.0;
  return (speed*std::cos(rad)) * (2.0*speed*std::sin(rad)/gravity);
}
PRINCIPIA_EXPORT double principia_projectile_max_height(double speed, double angle_deg, double gravity) {
  const double vy = speed*std::sin(angle_deg * 3.14159265358979323846 / 180.0);
  return vy*vy/(2.0*gravity);
}
}
