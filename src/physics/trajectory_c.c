/* PRINCIPIA C trajectory kernel. Validated SI inputs and caller-owned buffers. */
#include <math.h>
#include "trajectory_c.h"
#define PRINCIPIA_PI 3.14159265358979323846
int principia_c_sample_projectile(double speed, double angle_deg, double gravity, double duration, int count, double *x, double *y) {
    if (!x || !y || count < 2 || count > 1000000 || !isfinite(speed) || !isfinite(angle_deg) || !isfinite(gravity) || !isfinite(duration) || speed < 0.0 || gravity <= 0.0 || duration < 0.0) return 0;
    const double radians = angle_deg * PRINCIPIA_PI / 180.0;
    const double vx = speed * cos(radians), vy = speed * sin(radians);
    for (int i = 0; i < count; ++i) {
        const double t = duration * (double)i / (double)(count - 1);
        const double px = vx * t, py = vy * t - 0.5 * gravity * t * t;
        if (!isfinite(px) || !isfinite(py)) return 0;
        x[i] = px;
        y[i] = py;
    }
    return count;
}
