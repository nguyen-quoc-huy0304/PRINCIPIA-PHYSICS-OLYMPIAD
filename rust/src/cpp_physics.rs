//! Safe Rust facade over the native C++17 physics kernel.
use std::ffi::c_double;

unsafe extern "C" {
    fn principia_velocity(u: c_double, a: c_double, t: c_double) -> c_double;
    fn principia_displacement(u: c_double, a: c_double, t: c_double) -> c_double;
    fn principia_kinetic_energy(mass: c_double, speed: c_double) -> c_double;
    fn principia_projectile_range(speed: c_double, angle_deg: c_double, gravity: c_double) -> c_double;
    fn principia_projectile_max_height(speed: c_double, angle_deg: c_double, gravity: c_double) -> c_double;
}

fn checked(value: f64) -> Result<f64, PhysicsError> {
    if value.is_finite() { Ok(value) } else { Err(PhysicsError::InvalidInput) }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PhysicsError { InvalidInput }

/// Calls the C++ engine through the Rust application core.
pub fn velocity(initial: f64, acceleration: f64, seconds: f64) -> Result<f64, PhysicsError> {
    checked(unsafe { principia_velocity(initial, acceleration, seconds) })
}
pub fn displacement(initial: f64, acceleration: f64, seconds: f64) -> Result<f64, PhysicsError> {
    checked(unsafe { principia_displacement(initial, acceleration, seconds) })
}
pub fn kinetic_energy(mass_kg: f64, speed_mps: f64) -> Result<f64, PhysicsError> {
    checked(unsafe { principia_kinetic_energy(mass_kg, speed_mps) })
}
pub fn projectile_range(speed: f64, angle_deg: f64, gravity: f64) -> Result<f64, PhysicsError> {
    checked(unsafe { principia_projectile_range(speed, angle_deg, gravity) })
}
pub fn projectile_max_height(speed: f64, angle_deg: f64, gravity: f64) -> Result<f64, PhysicsError> {
    checked(unsafe { principia_projectile_max_height(speed, angle_deg, gravity) })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rust_calls_native_cpp_kernel() {
        assert!((velocity(3.0, 2.0, 4.0).unwrap() - 11.0).abs() < 1e-10);
        assert!((displacement(3.0, 2.0, 4.0).unwrap() - 28.0).abs() < 1e-10);
        assert!((kinetic_energy(2.0, 3.0).unwrap() - 9.0).abs() < 1e-10);
        assert!((projectile_range(10.0, 45.0, 9.81).unwrap() - 10.193679918).abs() < 1e-6);
        assert!(kinetic_energy(-1.0, 3.0).is_err());
    }
}
