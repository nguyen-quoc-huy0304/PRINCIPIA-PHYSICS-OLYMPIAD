#include "vector3.h"
#include <cassert>
#include <cmath>
#include <limits>

int main() {
  const principia_vec3 a{3.0, 4.0, 0.0};
  assert(std::abs(principia_vec3_magnitude(a) - 5.0) < 1e-12);
  principia_vec3 normalized{};
  assert(principia_vec3_normalize(a, &normalized) == 1);
  assert(std::abs(normalized.x - 0.6) < 1e-12);
  assert(std::abs(normalized.y - 0.8) < 1e-12);
  assert(std::abs(principia_vec3_dot(a, {0.0, 0.0, 2.0})) < 1e-12);
  const principia_vec3 cross = principia_vec3_cross(a, {0.0, 0.0, 2.0});
  assert(cross.x == 8.0 && cross.y == -6.0 && cross.z == 0.0);
  assert(principia_vec3_normalize({0.0, 0.0, 0.0}, &normalized) == 0);
  assert(principia_vec3_normalize(a, nullptr) == 0);
  const double nan = std::numeric_limits<double>::quiet_NaN();
  assert(principia_vec3_is_finite({nan, 1.0, 2.0}) == 0);
  assert(std::isnan(principia_vec3_magnitude({nan, 1.0, 2.0})));
  const auto sum = principia_vec3_add(a, {1.0, 2.0, 3.0});
  assert(sum.x == 4.0 && sum.y == 6.0 && sum.z == 3.0);
  const auto scaled = principia_vec3_scale(a, 2.0);
  assert(scaled.x == 6.0 && scaled.y == 8.0 && scaled.z == 0.0);
}
