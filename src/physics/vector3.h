#ifndef PRINCIPIA_PHYSICS_VECTOR3_H
#define PRINCIPIA_PHYSICS_VECTOR3_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct principia_vec3 {
  double x;
  double y;
  double z;
} principia_vec3;

int principia_vec3_is_finite(principia_vec3 value);
double principia_vec3_magnitude(principia_vec3 value);
int principia_vec3_normalize(principia_vec3 value, principia_vec3* output);
double principia_vec3_dot(principia_vec3 a, principia_vec3 b);
principia_vec3 principia_vec3_cross(principia_vec3 a, principia_vec3 b);
principia_vec3 principia_vec3_add(principia_vec3 a, principia_vec3 b);
principia_vec3 principia_vec3_sub(principia_vec3 a, principia_vec3 b);
principia_vec3 principia_vec3_scale(principia_vec3 value, double scalar);

#ifdef __cplusplus
}
#endif
#endif
