#include "physics_kernel.hpp"
#include <cmath>
#include <limits>
namespace principia::physics {
std::optional<double> mean(const std::vector<double>& values){if(values.empty())return std::nullopt;long double sum=0;for(double v:values){if(!std::isfinite(v))return std::nullopt;sum+=static_cast<long double>(v);}long double r=sum/values.size();if(!std::isfinite(r)||std::abs(r)>std::numeric_limits<double>::max())return std::nullopt;return static_cast<double>(r);}
std::optional<double> projectile_range(double speed,double angle,double gravity){constexpr double pi2=1.5707963267948966;if(!std::isfinite(speed)||!std::isfinite(angle)||!std::isfinite(gravity)||speed<0||gravity<=0||angle<0||angle>pi2)return std::nullopt;long double v=speed,g=gravity,a=angle,r=v*v*std::sin(2*a)/g;if(!std::isfinite(r)||r>std::numeric_limits<double>::max())return std::nullopt;return static_cast<double>(r);}
}
