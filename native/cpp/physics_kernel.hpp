#pragma once
#include <vector>
#include <optional>
namespace principia::physics {
std::optional<double> mean(const std::vector<double>& values);
std::optional<double> projectile_range(double speed_mps, double angle_radians, double gravity_mps2 = 9.80665);
}
