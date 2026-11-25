//! Validated 1D and 2D collision mechanics in SI-compatible units.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Collision1D {
    pub v1: f64,
    pub v2: f64,
    pub momentum_before: f64,
    pub momentum_after: f64,
    pub momentum_error: f64,
    pub kinetic_before: f64,
    pub kinetic_after: f64,
    pub kinetic_change: f64,
    pub energy_loss: f64,
    pub restitution: f64,
    pub total_mass: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DiskBody {
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub mass: f64,
    pub radius: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DiskCollision {
    pub a: DiskBody,
    pub b: DiskBody,
    pub collided: bool,
    pub impulse: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MomentumEnergy2D {
    pub px: f64,
    pub py: f64,
    pub kinetic: f64,
}

fn finite(values: &[f64]) -> bool {
    values.iter().all(|value| value.is_finite())
}

pub fn collide_1d(m1: f64, u1: f64, m2: f64, u2: f64, restitution: f64) -> Result<Collision1D, &'static str> {
    if !finite(&[m1, u1, m2, u2, restitution]) { return Err("collision inputs must be finite"); }
    if m1 <= 0.0 || m2 <= 0.0 { return Err("masses must be positive"); }
    if !(0.0..=1.0).contains(&restitution) { return Err("restitution must be between 0 and 1"); }
    let total_mass = m1 + m2;
    let momentum_before = m1 * u1 + m2 * u2;
    let relative_approach = u1 - u2;
    let v1 = (momentum_before - m2 * restitution * relative_approach) / total_mass;
    let v2 = (momentum_before + m1 * restitution * relative_approach) / total_mass;
    let momentum_after = m1 * v1 + m2 * v2;
    let kinetic_before = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    let kinetic_after = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    let values = [total_mass, momentum_before, v1, v2, momentum_after, kinetic_before, kinetic_after];
    if !finite(&values) { return Err("collision result overflow"); }
    let momentum_error = momentum_after - momentum_before;
    let kinetic_change = kinetic_after - kinetic_before;
    let energy_loss = (kinetic_before - kinetic_after).max(0.0);
    if !finite(&[momentum_error, kinetic_change, energy_loss]) { return Err("collision result overflow"); }
    Ok(Collision1D { v1, v2, momentum_before, momentum_after, momentum_error,
        kinetic_before, kinetic_after, kinetic_change, energy_loss, restitution, total_mass })
}

fn validate_body(body: DiskBody) -> Result<(), &'static str> {
    if !finite(&[body.x, body.y, body.vx, body.vy, body.mass, body.radius]) {
        return Err("body values must be finite");
    }
    if body.mass <= 0.0 || body.radius <= 0.0 { return Err("mass and radius must be positive"); }
    Ok(())
}

pub fn resolve_disk_collision(a: DiskBody, b: DiskBody, restitution: f64) -> Result<DiskCollision, &'static str> {
    validate_body(a)?;
    validate_body(b)?;
    if !restitution.is_finite() || !(0.0..=1.0).contains(&restitution) {
        return Err("restitution must be between 0 and 1");
    }
    let mut a = a;
    let mut b = b;
    let mut dx = b.x - a.x;
    let mut dy = b.y - a.y;
    let mut distance = dx.hypot(dy);
    let min_distance = a.radius + b.radius;
    if !distance.is_finite() || !min_distance.is_finite() { return Err("collision geometry overflow"); }
    if distance >= min_distance {
        return Ok(DiskCollision { a, b, collided: false, impulse: 0.0 });
    }
    if distance < 1e-12 { dx = 1.0; dy = 0.0; distance = 1.0; }
    let nx = dx / distance;
    let ny = dy / distance;
    let inv_a = 1.0 / a.mass;
    let inv_b = 1.0 / b.mass;
    let relative_normal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    let penetration = min_distance - distance;
    let correction = (penetration - 0.01).max(0.0) * 0.8 / (inv_a + inv_b);
    a.x -= nx * correction * inv_a;
    a.y -= ny * correction * inv_a;
    b.x += nx * correction * inv_b;
    b.y += ny * correction * inv_b;
    if relative_normal < 0.0 {
        let impulse = -(1.0 + restitution) * relative_normal / (inv_a + inv_b);
        a.vx -= impulse * inv_a * nx;
        a.vy -= impulse * inv_a * ny;
        b.vx += impulse * inv_b * nx;
        b.vy += impulse * inv_b * ny;
    }
    let impulse = if relative_normal < 0.0 {
        -(1.0 + restitution) * relative_normal / (inv_a + inv_b)
    } else { 0.0 };
    validate_body(a)?;
    validate_body(b)?;
    if !impulse.is_finite() { return Err("collision impulse overflow"); }
    Ok(DiskCollision { a, b, collided: true, impulse })
}

pub fn momentum_energy_2d(bodies: &[DiskBody]) -> Result<MomentumEnergy2D, &'static str> {
    if bodies.is_empty() || bodies.len() > 12 { return Err("body count must be between 1 and 12"); }
    let mut totals = MomentumEnergy2D { px: 0.0, py: 0.0, kinetic: 0.0 };
    for body in bodies {
        validate_body(*body)?;
        totals.px += body.mass * body.vx;
        totals.py += body.mass * body.vy;
        totals.kinetic += 0.5 * body.mass * (body.vx * body.vx + body.vy * body.vy);
    }
    if !finite(&[totals.px, totals.py, totals.kinetic]) { return Err("momentum or energy overflow"); }
    Ok(totals)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn body(x: f64, vx: f64) -> DiskBody {
        DiskBody { x, y: 0.0, vx, vy: 0.0, mass: 1.0, radius: 1.0 }
    }

    #[test]
    fn one_dimensional_collision_conserves_momentum() {
        let result = collide_1d(1.0, 3.0, 2.0, -1.0, 1.0).unwrap();
        assert!((result.momentum_after - result.momentum_before).abs() < 1e-12);
        assert!((result.kinetic_after - result.kinetic_before).abs() < 1e-12);
        assert!((result.v1 + 7.0 / 3.0).abs() < 1e-12);
        assert!((result.v2 - 5.0 / 3.0).abs() < 1e-12);
    }

    #[test]
    fn inelastic_collision_loses_nonnegative_energy() {
        let result = collide_1d(1.0, 3.0, 2.0, -1.0, 0.0).unwrap();
        assert!((result.v1 - result.v2).abs() < 1e-12);
        assert!(result.energy_loss > 0.0);
    }

    #[test]
    fn disk_collision_separates_bodies_and_applies_impulse() {
        let result = resolve_disk_collision(body(0.0, 1.0), body(1.5, -1.0), 1.0).unwrap();
        assert!(result.collided);
        assert!(result.impulse > 0.0);
        assert!(result.b.x - result.a.x >= 1.99);
        assert!(result.a.vx < 0.0 && result.b.vx > 0.0);
    }

    #[test]
    fn separated_disks_do_not_change() {
        let a = body(0.0, 1.0);
        let b = body(3.0, -1.0);
        let result = resolve_disk_collision(a, b, 1.0).unwrap();
        assert!(!result.collided);
        assert_eq!(result.a, a);
        assert_eq!(result.b, b);
    }

    #[test]
    fn momentum_energy_checks_body_bounds() {
        let result = momentum_energy_2d(&[body(0.0, 2.0), body(2.0, -1.0)]).unwrap();
        assert_eq!(result.px, 1.0);
        assert_eq!(result.kinetic, 2.5);
        assert!(momentum_energy_2d(&[]).is_err());
    }

    #[test]
    fn rejects_invalid_inputs_and_overflow() {
        assert!(collide_1d(0.0, 1.0, 1.0, 0.0, 1.0).is_err());
        assert!(collide_1d(1.0, f64::NAN, 1.0, 0.0, 1.0).is_err());
        assert!(collide_1d(f64::MAX, 1.0, f64::MAX, 1.0, 1.0).is_err());
        assert!(resolve_disk_collision(body(0.0, 0.0), body(1.0, 0.0), 2.0).is_err());
    }
}
