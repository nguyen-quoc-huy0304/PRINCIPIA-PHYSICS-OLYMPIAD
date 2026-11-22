//! Rapier-backed rigid-body simulation for mechanics and robotics labs.
//! Upstream engine: Rapier 3D, Apache-2.0, Copyright Dimforge contributors.
//! PRINCIPIA keeps its analytical SI solvers separate from this contact/dynamics engine.

use rapier3d::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RigidBodyLabError {
    NonFiniteInput,
    InvalidGravity,
    InvalidHeight,
    InvalidRadius,
    InvalidRestitution,
}

fn finite(values: &[f32]) -> bool {
    values.iter().all(|value| value.is_finite())
}

/// A small, deterministic 3D drop-and-collision lab.
/// Units are SI: metres, seconds, kilograms, and metres per second.
pub struct RigidBodyLab {
    world: PhysicsWorld,
    body: RigidBodyHandle,
    elapsed_steps: u64,
}

impl RigidBodyLab {
    pub fn new(
        initial_height_m: f32,
        gravity_mps2: f32,
        radius_m: f32,
        restitution: f32,
    ) -> Result<Self, RigidBodyLabError> {
        if !finite(&[initial_height_m, gravity_mps2, radius_m, restitution]) {
            return Err(RigidBodyLabError::NonFiniteInput);
        }
        if gravity_mps2 <= 0.0 {
            return Err(RigidBodyLabError::InvalidGravity);
        }
        if radius_m <= 0.0 {
            return Err(RigidBodyLabError::InvalidRadius);
        }
        if initial_height_m <= radius_m + 0.1 {
            return Err(RigidBodyLabError::InvalidHeight);
        }
        if !(0.0..=1.0).contains(&restitution) {
            return Err(RigidBodyLabError::InvalidRestitution);
        }

        let mut world = PhysicsWorld::new();
        world.gravity = Vector::new(0.0, -gravity_mps2, 0.0);
        world.insert_collider(
            ColliderBuilder::cuboid(100.0, 0.1, 100.0),
            None,
        );
        let (body, _) = world.insert(
            RigidBodyBuilder::dynamic()
                .translation(Vector::new(0.0, initial_height_m, 0.0)),
            ColliderBuilder::ball(radius_m).restitution(restitution),
        );

        Ok(Self { world, body, elapsed_steps: 0 })
    }

    /// Advance by a fixed number of Rapier integration steps.
    pub fn step(&mut self, count: u32) {
        for _ in 0..count {
            self.world.step();
            self.elapsed_steps = self.elapsed_steps.saturating_add(1);
        }
    }

    pub fn position_m(&self) -> [f32; 3] {
        let p = self.world.bodies[self.body].translation();
        [p.x, p.y, p.z]
    }

    pub fn velocity_mps(&self) -> [f32; 3] {
        let v = self.world.bodies[self.body].linvel();
        [v.x, v.y, v.z]
    }

    pub fn elapsed_steps(&self) -> u64 {
        self.elapsed_steps
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn body_falls_under_gravity() {
        let mut lab = RigidBodyLab::new(10.0, 9.81, 0.5, 0.7).unwrap();
        lab.step(30);
        let p = lab.position_m();
        assert!(p[1].is_finite());
        assert!(p[1] < 10.0);
        assert!(p[1] > 0.6);
        assert_eq!(lab.elapsed_steps(), 30);
    }

    #[test]
    fn body_collides_with_ground_without_tunnelling() {
        let mut lab = RigidBodyLab::new(10.0, 9.81, 0.5, 0.7).unwrap();
        lab.step(600);
        let p = lab.position_m();
        assert!(p[1].is_finite());
        assert!(p[1] >= 0.58, "sphere penetrated the ground: {}", p[1]);
    }

    #[test]
    fn rejects_invalid_physical_parameters() {
        assert_eq!(
            RigidBodyLab::new(10.0, 0.0, 0.5, 0.7).err(),
            Some(RigidBodyLabError::InvalidGravity)
        );
        assert_eq!(
            RigidBodyLab::new(10.0, 9.81, 0.5, 1.2).err(),
            Some(RigidBodyLabError::InvalidRestitution)
        );
    }
}
