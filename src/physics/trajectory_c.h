#ifndef PRINCIPIA_C_TRAJECTORY_H
#define PRINCIPIA_C_TRAJECTORY_H
#ifdef __cplusplus
extern "C" {
#endif
int principia_c_sample_projectile(double speed, double angle_deg, double gravity, double duration, int count, double *x, double *y);
#ifdef __cplusplus
}
#endif
#endif
