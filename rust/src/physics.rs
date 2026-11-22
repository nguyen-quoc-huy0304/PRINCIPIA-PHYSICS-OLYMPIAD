//! Validated SI-unit physics primitives. Heavy simulation kernels can be delegated to C++.
use std::f64::consts::PI;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PhysicsError { NonFinite, NegativeMass, NegativeSpeed, InvalidGravity }

fn finite(values: &[f64]) -> Result<(), PhysicsError> {
    if values.iter().all(|v| v.is_finite()) { Ok(()) } else { Err(PhysicsError::NonFinite) }
}

fn finite_result(value: f64) -> Result<f64, PhysicsError> {
    if value.is_finite() { Ok(value) } else { Err(PhysicsError::NonFinite) }
}

pub fn velocity(u: f64, acceleration: f64, time: f64) -> Result<f64, PhysicsError> {
    finite(&[u, acceleration, time])?;
    finite_result(u + acceleration * time)
}

pub fn displacement(u: f64, acceleration: f64, time: f64) -> Result<f64, PhysicsError> {
    finite(&[u, acceleration, time])?;
    finite_result(u * time + 0.5 * acceleration * time * time)
}

pub fn kinetic_energy(mass: f64, speed: f64) -> Result<f64, PhysicsError> {
    finite(&[mass, speed])?;
    if mass < 0.0 { return Err(PhysicsError::NegativeMass); }
    finite_result(0.5 * mass * speed * speed)
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Projectile {
    pub range: f64, pub flight_time: f64, pub max_height: f64,
    pub horizontal_velocity: f64, pub vertical_velocity: f64,
}

pub fn projectile(speed: f64, angle_degrees: f64, gravity: f64) -> Result<Projectile, PhysicsError> {
    finite(&[speed, angle_degrees, gravity])?;
    if speed < 0.0 { return Err(PhysicsError::NegativeSpeed); }
    if gravity <= 0.0 { return Err(PhysicsError::InvalidGravity); }
    let angle = angle_degrees * PI / 180.0;
    let vx = speed * angle.cos();
    let vy = speed * angle.sin();
    let time = 2.0 * vy / gravity;
    let result = Projectile {
        range: vx * time,
        flight_time: time,
        max_height: vy * vy / (2.0 * gravity),
        horizontal_velocity: vx,
        vertical_velocity: vy,
    };
    finite(&[result.range, result.flight_time, result.max_height,
        result.horizontal_velocity, result.vertical_velocity])?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn projectile_at_45_degrees() {
        let p = projectile(10.0, 45.0, 10.0).unwrap();
        assert!((p.range - 10.0).abs() < 1e-10);
    }
    #[test] fn rejects_invalid_gravity() {
        assert_eq!(projectile(10.0, 45.0, 0.0), Err(PhysicsError::InvalidGravity));
    }
    #[test] fn rejects_overflow_in_derived_values() {
        assert_eq!(velocity(f64::MAX, f64::MAX, 2.0), Err(PhysicsError::NonFinite));
        assert_eq!(kinetic_energy(f64::MAX, f64::MAX), Err(PhysicsError::NonFinite));
        assert_eq!(projectile(f64::MAX, 45.0, 9.81), Err(PhysicsError::NonFinite));
    }
}
