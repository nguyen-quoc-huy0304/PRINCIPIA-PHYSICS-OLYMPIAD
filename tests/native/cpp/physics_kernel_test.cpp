#include "../../../native/cpp/physics_kernel.hpp"
#include <cassert>
#include <cmath>
#include <limits>
int main(){using namespace principia::physics;auto m=mean({2,4,6});assert(m&&*m==4);assert(!mean({}));assert(!mean({1,std::numeric_limits<double>::infinity()}));auto r=projectile_range(10,0.7853981633974483);assert(r&&std::abs(*r-10.197162)<.01);assert(!projectile_range(-1,.5));assert(!projectile_range(10,2));assert(projectile_range(0,0));}
