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


#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Disk {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub mass: f64,
    pub radius: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DiskCollision {
    pub collided: bool,
    pub impulse: f64,
    pub a: Disk,
    pub b: Disk,
}

pub fn resolve_disks(mut a: Disk, mut b: Disk, restitution: f64) -> Result<DiskCollision, CollisionError> {
    let inputs = [a.x,a.y,a.vx,a.vy,a.mass,a.radius,b.x,b.y,b.vx,b.vy,b.mass,b.radius,restitution];
    if !inputs.iter().all(|value| value.is_finite()) { return Err(CollisionError::NonFinite); }
    if a.mass <= 0.0 || b.mass <= 0.0 || a.radius <= 0.0 || b.radius <= 0.0 {
        return Err(CollisionError::InvalidMass);
    }
    if !(0.0..=1.0).contains(&restitution) { return Err(CollisionError::InvalidRestitution); }

    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let distance = dx.hypot(dy);
    let minimum_distance = a.radius + b.radius;
    if distance >= minimum_distance {
        return Ok(DiskCollision { collided: false, impulse: 0.0, a, b });
    }
    let (nx, ny) = if distance < 1e-12 { (1.0, 0.0) } else { (dx / distance, dy / distance) };
    let inverse_a = 1.0 / a.mass;
    let inverse_b = 1.0 / b.mass;
    let inverse_sum = inverse_a + inverse_b;
    let relative_normal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    let penetration = minimum_distance - distance;
    let correction = (penetration - 0.01).max(0.0) * 0.8 / inverse_sum;
    a.x -= nx * correction * inverse_a;
    a.y -= ny * correction * inverse_a;
    b.x += nx * correction * inverse_b;
    b.y += ny * correction * inverse_b;

    let impulse = if relative_normal < 0.0 {
        let impulse = -(1.0 + restitution) * relative_normal / inverse_sum;
        a.vx -= impulse * inverse_a * nx;
        a.vy -= impulse * inverse_a * ny;
        b.vx += impulse * inverse_b * nx;
        b.vy += impulse * inverse_b * ny;
        impulse
    } else { 0.0 };

    let outputs = [a.x,a.y,a.vx,a.vy,b.x,b.y,b.vx,b.vy,impulse];
    if !outputs.iter().all(|value| value.is_finite()) { return Err(CollisionError::NonFinite); }
    Ok(DiskCollision { collided: true, impulse, a, b })
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
    fn equal_mass_elastic_disk_collision_exchanges_normal_velocity() {
        let a = Disk { x: 0.0, y: 0.0, vx: 1.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let b = Disk { x: 1.5, y: 0.0, vx: -1.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let result = resolve_disks(a, b, 1.0).unwrap();
        assert!(result.collided);
        assert!((result.a.vx + 1.0).abs() < 1e-12);
        assert!((result.b.vx - 1.0).abs() < 1e-12);
    }

    #[test]
    fn separating_disks_are_corrected_without_impulse() {
        let a = Disk { x: 0.0, y: 0.0, vx: -1.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let b = Disk { x: 1.0, y: 0.0, vx: 1.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let result = resolve_disks(a, b, 0.5).unwrap();
        assert_eq!(result.impulse, 0.0);
        assert!(result.b.x - result.a.x >= 1.79);
    }

    #[test]
    fn coincident_disk_centers_are_separated_using_a_stable_normal() {
        let a = Disk { x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let b = Disk { x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        let result = resolve_disks(a, b, 0.5).unwrap();
        assert!(result.b.x - result.a.x >= 1.59);
        assert!(result.a.y.is_finite() && result.b.y.is_finite());
    }

    #[test]
    fn disk_collision_rejects_invalid_mass_and_restitution() {
        let a = Disk { x: 0.0, y: 0.0, vx: 0.0, vy: 0.0, mass: 0.0, radius: 1.0 };
        let b = Disk { x: 1.0, y: 0.0, vx: 0.0, vy: 0.0, mass: 1.0, radius: 1.0 };
        assert_eq!(resolve_disks(a, b, 1.0), Err(CollisionError::InvalidMass));
        let valid = Disk { mass: 1.0, ..a };
        assert_eq!(resolve_disks(valid, b, 1.1), Err(CollisionError::InvalidRestitution));
    }

    #[test]
    fn rejects_invalid_inputs_and_overflow() {
        assert_eq!(collide_1d(0.0, 1.0, 1.0, 0.0, 1.0), Err(CollisionError::InvalidMass));
        assert_eq!(collide_1d(1.0, 1.0, 1.0, 0.0, 1.1), Err(CollisionError::InvalidRestitution));
        assert_eq!(collide_1d(1.0, f64::INFINITY, 1.0, 0.0, 1.0), Err(CollisionError::NonFinite));
        assert_eq!(collide_1d(f64::MAX, 1.0, f64::MAX, 0.0, 1.0), Err(CollisionError::NonFinite));
    }
}
