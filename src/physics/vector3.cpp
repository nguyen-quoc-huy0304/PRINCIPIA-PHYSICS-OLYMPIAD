#include "vector3.h"
#include <cmath>
#include <limits>

extern "C" {
int principia_vec3_is_finite(principia_vec3 v) {
  return std::isfinite(v.x) && std::isfinite(v.y) && std::isfinite(v.z);
}
double principia_vec3_magnitude(principia_vec3 v) {
  if (!principia_vec3_is_finite(v)) return std::numeric_limits<double>::quiet_NaN();
  return std::hypot(v.x, v.y, v.z);
}
int principia_vec3_normalize(principia_vec3 v, principia_vec3* output) {
  if (output == nullptr || !principia_vec3_is_finite(v)) return 0;
  const double magnitude = principia_vec3_magnitude(v);
  if (!std::isfinite(magnitude) || magnitude <= std::numeric_limits<double>::epsilon()) return 0;
  *output = {v.x / magnitude, v.y / magnitude, v.z / magnitude};
  return principia_vec3_is_finite(*output);
}
double principia_vec3_dot(principia_vec3 a, principia_vec3 b) {
  if (!principia_vec3_is_finite(a) || !principia_vec3_is_finite(b)) return std::numeric_limits<double>::quiet_NaN();
  return a.x*b.x + a.y*b.y + a.z*b.z;
}
principia_vec3 principia_vec3_cross(principia_vec3 a, principia_vec3 b) {
  if (!principia_vec3_is_finite(a) || !principia_vec3_is_finite(b)) {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    return {nan, nan, nan};
  }
  return {a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x};
}
principia_vec3 principia_vec3_add(principia_vec3 a, principia_vec3 b) {
  return {a.x+b.x, a.y+b.y, a.z+b.z};
}
principia_vec3 principia_vec3_sub(principia_vec3 a, principia_vec3 b) {
  return {a.x-b.x, a.y-b.y, a.z-b.z};
}
principia_vec3 principia_vec3_scale(principia_vec3 v, double s) {
  if (!principia_vec3_is_finite(v) || !std::isfinite(s)) {
    const double nan = std::numeric_limits<double>::quiet_NaN();
    return {nan, nan, nan};
  }
  return {v.x*s, v.y*s, v.z*s};
}
}
