//! Safe Rust facade for the C++ vector3 kernel. Native builds only.
use std::ffi::c_int;

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vec3 { pub x: f64, pub y: f64, pub z: f64 }

unsafe extern "C" {
    fn principia_vec3_is_finite(v: Vec3) -> c_int;
    fn principia_vec3_magnitude(v: Vec3) -> f64;
    fn principia_vec3_normalize(v: Vec3, output: *mut Vec3) -> c_int;
    fn principia_vec3_dot(a: Vec3, b: Vec3) -> f64;
    fn principia_vec3_cross(a: Vec3, b: Vec3) -> Vec3;
    fn principia_vec3_add(a: Vec3, b: Vec3) -> Vec3;
    fn principia_vec3_sub(a: Vec3, b: Vec3) -> Vec3;
    fn principia_vec3_scale(v: Vec3, scalar: f64) -> Vec3;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VectorError { NonFinite, ZeroMagnitude }

pub fn is_finite(v: Vec3) -> bool { unsafe { principia_vec3_is_finite(v) != 0 } }
pub fn magnitude(v: Vec3) -> Result<f64, VectorError> {
    let result = unsafe { principia_vec3_magnitude(v) };
    if result.is_finite() { Ok(result) } else { Err(VectorError::NonFinite) }
}
pub fn normalize(v: Vec3) -> Result<Vec3, VectorError> {
    let mut out = Vec3 { x: 0.0, y: 0.0, z: 0.0 };
    let result = unsafe { principia_vec3_normalize(v, &mut out) };
    if result != 0 { return Ok(out); }
    if !is_finite(v) { Err(VectorError::NonFinite) } else { Err(VectorError::ZeroMagnitude) }
}
pub fn dot(a: Vec3, b: Vec3) -> Result<f64, VectorError> {
    let result = unsafe { principia_vec3_dot(a, b) };
    if result.is_finite() { Ok(result) } else { Err(VectorError::NonFinite) }
}
pub fn cross(a: Vec3, b: Vec3) -> Result<Vec3, VectorError> {
    let result = unsafe { principia_vec3_cross(a, b) };
    if is_finite(result) { Ok(result) } else { Err(VectorError::NonFinite) }
}
pub fn add(a: Vec3, b: Vec3) -> Vec3 { unsafe { principia_vec3_add(a, b) } }
pub fn subtract(a: Vec3, b: Vec3) -> Vec3 { unsafe { principia_vec3_sub(a, b) } }
pub fn scale(v: Vec3, scalar: f64) -> Result<Vec3, VectorError> {
    let result = unsafe { principia_vec3_scale(v, scalar) };
    if is_finite(result) { Ok(result) } else { Err(VectorError::NonFinite) }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rust_facade_calls_cpp_vector_kernel() {
        let v = Vec3 { x: 3.0, y: 4.0, z: 0.0 };
        assert!((magnitude(v).unwrap() - 5.0).abs() < 1e-12);
        let n = normalize(v).unwrap();
        assert!((n.x - 0.6).abs() < 1e-12 && (n.y - 0.8).abs() < 1e-12);
        assert_eq!(dot(v, Vec3 { x: 0.0, y: 0.0, z: 2.0 }).unwrap(), 0.0);
        assert_eq!(cross(v, Vec3 { x: 0.0, y: 0.0, z: 2.0 }).unwrap(), Vec3 { x: 8.0, y: -6.0, z: 0.0 });
        assert_eq!(normalize(Vec3 { x: 0.0, y: 0.0, z: 0.0 }), Err(VectorError::ZeroMagnitude));
        assert_eq!(scale(v, 2.0).unwrap(), Vec3 { x: 6.0, y: 8.0, z: 0.0 });
    }
}
