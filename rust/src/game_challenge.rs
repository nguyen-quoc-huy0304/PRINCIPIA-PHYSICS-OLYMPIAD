//! Deterministic challenge generation and trajectory sampling for the physics arcade.
use crate::physics::{projectile, PhysicsError};

const GRAVITIES: [f64; 3] = [1.62, 9.80665, 24.79];

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GameChallenge {
    pub speed_mps: f64,
    pub gravity_mps2: f64,
    pub target_m: f64,
}

fn next_random(state: &mut u64) -> f64 {
    *state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    ((*state >> 11) as f64) / ((1_u64 << 53) as f64)
}

pub fn generate_challenge(seed: u64) -> GameChallenge {
    let mut state = seed.max(1);
    let speed = 16.0 + (next_random(&mut state) * 13.0).floor();
    let gravity = GRAVITIES[(next_random(&mut state) * GRAVITIES.len() as f64) as usize];
    let max_range = speed * speed / gravity;
    let target = (max_range * (0.52 + 0.40 * next_random(&mut state)) * 10.0).round() / 10.0;
    GameChallenge { speed_mps: speed, gravity_mps2: gravity, target_m: target }
}

pub fn clamp_target(target_m: f64, speed_mps: f64, gravity_mps2: f64) -> Result<f64, PhysicsError> {
    if !target_m.is_finite() || !speed_mps.is_finite() || !gravity_mps2.is_finite()
        || speed_mps <= 0.0 || gravity_mps2 <= 0.0 {
        return Err(PhysicsError::NonFinite);
    }
    let max_range = speed_mps * speed_mps / gravity_mps2;
    if !max_range.is_finite() { return Err(PhysicsError::NonFinite); }
    let low = (max_range * 0.51 * 10.0).ceil() / 10.0;
    let high = (max_range * 0.99 * 10.0).floor() / 10.0;
    Ok(((target_m.max(low).min(high) * 10.0).round() / 10.0).max(0.0))
}

pub fn trajectory(speed_mps: f64, angle_degrees: f64, gravity_mps2: f64, samples: usize)
    -> Result<Vec<[f64; 2]>, PhysicsError>
{
    if !(2..=512).contains(&samples) { return Err(PhysicsError::NonFinite); }
    let flight = projectile(speed_mps, angle_degrees, gravity_mps2)?;
    let radians = angle_degrees.to_radians();
    let duration = flight.flight_time;
    let vx = speed_mps * radians.cos();
    let vy = speed_mps * radians.sin();
    (0..samples).map(|index| {
        let time = duration * index as f64 / (samples - 1) as f64;
        let x = vx * time;
        let y = vy * time - 0.5 * gravity_mps2 * time * time;
        if x.is_finite() && y.is_finite() { Ok([x, y]) } else { Err(PhysicsError::NonFinite) }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn challenge_generation_is_deterministic_and_bounded() {
        let first = generate_challenge(42);
        assert_eq!(first, generate_challenge(42));
        assert!((16.0..=28.0).contains(&first.speed_mps));
        assert!(GRAVITIES.contains(&first.gravity_mps2));
        assert!(first.target_m > 0.0);
        assert!(first.target_m < first.speed_mps.powi(2) / first.gravity_mps2);
    }

    #[test]
    fn target_clamping_stays_inside_playable_range() {
        let target = clamp_target(1.0, 20.0, 9.80665).unwrap();
        let max_range = 20.0_f64.powi(2) / 9.80665;
        assert!(target >= (max_range * 0.51 * 10.0).ceil() / 10.0);
        assert!(target <= (max_range * 0.99 * 10.0).floor() / 10.0);
    }

    #[test]
    fn trajectory_starts_and_lands_at_ground_level() {
        let points = trajectory(20.0, 45.0, 9.80665, 49).unwrap();
        assert_eq!(points.len(), 49);
        assert_eq!(points[0], [0.0, 0.0]);
        assert!(points.last().unwrap()[1].abs() < 1e-10);
    }

    #[test]
    fn rejects_invalid_trajectory_parameters() {
        assert!(trajectory(20.0, 45.0, 9.80665, 1).is_err());
        assert!(trajectory(-1.0, 45.0, 9.80665, 10).is_err());
    }
}
