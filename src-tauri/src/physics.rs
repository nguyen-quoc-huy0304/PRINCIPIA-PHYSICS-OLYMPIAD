use serde::Serialize;

const STANDARD_GRAVITY: f64 = 9.80665;

#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
pub struct MotionResult {
    pub position: f64,
    pub velocity: f64,
    pub acceleration: f64,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq)]
pub struct ProjectileResult {
    pub range: f64,
    pub flight_time: f64,
    pub max_height: f64,
    pub vx: f64,
    pub vy: f64,
    pub impact_speed: f64,
}

fn finite(values: &[f64]) -> Result<(), String> {
    if values.iter().all(|value| value.is_finite()) {
        Ok(())
    } else {
        Err("All physics inputs must be finite numbers".into())
    }
}

pub fn motion(u: f64, a: f64, t: f64) -> Result<MotionResult, String> {
    finite(&[u, a, t])?;
    Ok(MotionResult {
        position: u * t + 0.5 * a * t * t,
        velocity: u + a * t,
        acceleration: a,
    })
}

pub fn kinetic_energy(mass: f64, speed: f64) -> Result<f64, String> {
    finite(&[mass, speed])?;
    if mass < 0.0 || speed < 0.0 {
        return Err("Mass and speed must be non-negative".into());
    }
    Ok(0.5 * mass * speed * speed)
}

pub fn projectile(speed: f64, angle_deg: f64, gravity: f64) -> Result<ProjectileResult, String> {
    finite(&[speed, angle_deg, gravity])?;
    if speed < 0.0 || !(0.0..=90.0).contains(&angle_deg) || gravity <= 0.0 {
        return Err("Use speed >= 0, angle between 0 and 90 degrees, and gravity > 0".into());
    }
    let angle = angle_deg.to_radians();
    let vx = speed * angle.cos();
    let vy = speed * angle.sin();
    let flight_time = 2.0 * vy / gravity;
    Ok(ProjectileResult {
        range: vx * flight_time,
        flight_time,
        max_height: vy * vy / (2.0 * gravity),
        vx,
        vy,
        impact_speed: speed,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constant_acceleration_matches_si_equations() {
        let result = motion(3.0, 2.0, 4.0).unwrap();
        assert_eq!(result.position, 28.0);
        assert_eq!(result.velocity, 11.0);
    }

    #[test]
    fn kinetic_energy_is_correct() {
        assert_eq!(kinetic_energy(2.0, 3.0).unwrap(), 9.0);
    }

    #[test]
    fn projectile_at_45_degrees_is_symmetric() {
        let result = projectile(10.0, 45.0, STANDARD_GRAVITY).unwrap();
        assert!((result.range - (100.0 / STANDARD_GRAVITY)).abs() < 1e-10);
    }

    #[test]
    fn invalid_values_are_rejected() {
        assert!(motion(f64::NAN, 0.0, 1.0).is_err());
        assert!(kinetic_energy(-1.0, 2.0).is_err());
        assert!(projectile(10.0, 91.0, STANDARD_GRAVITY).is_err());
    }
}
