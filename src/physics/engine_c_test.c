#include "engine.h"
#include <math.h>

int main(void) {
    const double velocity = principia_velocity(3.0, 2.0, 4.0);
    const double energy = principia_kinetic_energy(2.0, 3.0);
    if (fabs(velocity - 11.0) > 1e-12) return 1;
    if (fabs(energy - 9.0) > 1e-12) return 2;
    if (principia_validate_inputs(1.0, 2.0, 3.0) != 1) return 3;
    if (principia_validate_inputs(1.0, NAN, 3.0) != 0) return 4;
    return 0;
}
