#include "engine.h"
#include <cassert>
#include <cmath>
int main() {
  assert(std::abs(principia_velocity(2,3,4)-14)<1e-12);
  assert(std::abs(principia_displacement(2,3,4)-32)<1e-12);
  assert(std::abs(principia_kinetic_energy(2,3)-9)<1e-12);
  assert(std::abs(principia_projectile_range(10,45,10)-10)<1e-10);
  assert(std::abs(principia_projectile_max_height(10,90,10)-5)<1e-10);
  assert(std::isnan(principia_kinetic_energy(-1,3)));
  assert(std::isnan(principia_projectile_range(10,45,0)));
  double x[3]{}, y[3]{};
  assert(principia_projectile_trajectory(10,90,10,2,3,x,y)==3);
  assert(std::abs(x[1])<1e-10 && std::abs(y[1]-7.5)<1e-10);
  assert(std::abs(y[2])<1e-10);
  assert(principia_projectile_trajectory(10,45,10,2,1,x,y)==0);
  assert(principia_projectile_trajectory(10,45,10,2,3,nullptr,y)==0);
}
