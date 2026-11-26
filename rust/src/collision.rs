//! One-dimensional rigid-body collision model with validated SI inputs.

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CollisionError {
    NonFinite,
    InvalidMass,
    InvalidRestitution,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Collision1D {
    pub velocity_a: f64,
    pub velocity_b: f64,
    pub momentum_before: f64,
    pub momentum_after: f64,
    pub momentum_error: f64,
    pub kinetic_before: f64,
    pub kinetic_after: f64,
    pub kinetic_change: f64,
    pub energy_loss: f64,
    pub total_mass: f64,
}

pub fn collide_1d(mass_a: f64, velocity_a: f64, mass_b: f64, velocity_b: f64, restitution: f64) -> Result<Collision1D, CollisionError> {
    let inputs = [mass_a, velocity_a, mass_b, velocity_b, restitution];
    if !inputs.iter().all(|value| value.is_finite()) { return Err(CollisionError::NonFinite); }
    if mass_a <= 0.0 || mass_b <= 0.0 { return Err(CollisionError::InvalidMass); }
    if !(0.0..=1.0).contains(&restitution) { return Err(CollisionError::InvalidRestitution); }

    let total_mass = mass_a + mass_b;
    let momentum_before = mass_a * velocity_a + mass_b * velocity_b;
    let relative_velocity = velocity_a - velocity_b;
    let velocity_a_after = (momentum_before - mass_b * restitution * relative_velocity) / total_mass;
    let velocity_b_after = (momentum_before + mass_a * restitution * relative_velocity) / total_mass;
    let momentum_after = mass_a * velocity_a_after + mass_b * velocity_b_after;
    let kinetic_before = 0.5 * mass_a * velocity_a.powi(2) + 0.5 * mass_b * velocity_b.powi(2);
    let kinetic_after = 0.5 * mass_a * velocity_a_after.powi(2) + 0.5 * mass_b * velocity_b_after.powi(2);
    let values = [total_mass, momentum_before, velocity_a_after, velocity_b_after,
        momentum_after, kinetic_before, kinetic_after];
    if !values.iter().all(|value| value.is_finite()) { return Err(CollisionError::NonFinite); }

    let momentum_error = momentum_after - momentum_before;
    let kinetic_change = kinetic_after - kinetic_before;
    Ok(Collision1D {
        velocity_a: velocity_a_after,
        velocity_b: velocity_b_after,
        momentum_before,
        momentum_after,
        momentum_error,
        kinetic_before,
        kinetic_after,
        kinetic_change,
        energy_loss: (kinetic_before - kinetic_after).max(0.0),
        total_mass,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn elastic_collision_conserves_momentum_and_energy() {
        let result = collide_1d(1.0, 3.0, 1.0, -1.0, 1.0).unwrap();
        assert!((result.velocity_a + 1.0).abs() < 1e-12);
        assert!((result.velocity_b - 3.0).abs() < 1e-12);
        assert!(result.momentum_error.abs() < 1e-12);
        assert!(result.kinetic_change.abs() < 1e-12);
    }

    #[test]
    fn perfectly_inelastic_collision_uses_center_of_mass_velocity() {
        let result = collide_1d(1.0, 4.0, 3.0, 0.0, 0.0).unwrap();
        assert!((result.velocity_a - 1.0).abs() < 1e-12);
        assert!((result.velocity_b - 1.0).abs() < 1e-12);
        assert!(result.energy_loss > 0.0);
    }

    #[test]
    fn rejects_invalid_inputs_and_overflow() {
        assert_eq!(collide_1d(0.0, 1.0, 1.0, 0.0, 1.0), Err(CollisionError::InvalidMass));
        assert_eq!(collide_1d(1.0, 1.0, 1.0, 0.0, 1.1), Err(CollisionError::InvalidRestitution));
        assert_eq!(collide_1d(1.0, f64::INFINITY, 1.0, 0.0, 1.0), Err(CollisionError::NonFinite));
        assert_eq!(collide_1d(f64::MAX, 1.0, f64::MAX, 0.0, 1.0), Err(CollisionError::NonFinite));
    }
}
