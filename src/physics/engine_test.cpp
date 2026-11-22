#include <cassert>
#include <cmath>
extern "C" {
double principia_velocity(double,double,double);
double principia_displacement(double,double,double);
double principia_kinetic_energy(double,double);
double principia_projectile_range(double,double,double);
double principia_projectile_max_height(double,double,double);
}
int main() {
  assert(std::abs(principia_velocity(2,3,4)-14)<1e-12);
  assert(std::abs(principia_displacement(2,3,4)-32)<1e-12);
  assert(std::abs(principia_kinetic_energy(2,3)-9)<1e-12);
  assert(std::abs(principia_projectile_range(10,45,10)-10)<1e-10);
  assert(std::abs(principia_projectile_max_height(10,90,10)-5)<1e-10);
  assert(std::isnan(principia_kinetic_energy(-1,3)));
  assert(std::isnan(principia_projectile_range(10,45,0)));
}
