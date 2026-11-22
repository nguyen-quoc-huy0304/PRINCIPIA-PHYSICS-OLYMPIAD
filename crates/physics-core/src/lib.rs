use serde::Serialize;

pub const STANDARD_GRAVITY: f64 = 9.80665;

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


/// Additional calculator kernels shared by web (WASM) and native builds.
pub fn newton_force(mass: f64, acceleration: f64) -> Result<f64, String> {
    finite(&[mass, acceleration])?;
    if mass < 0.0 { return Err("Mass must be non-negative".into()); }
    Ok(mass * acceleration)
}

pub fn work_and_power(force: f64, displacement: f64, angle_deg: f64, time: f64) -> Result<(f64, f64), String> {
    finite(&[force, displacement, angle_deg, time])?;
    if time <= 0.0 { return Err("Time must be greater than zero".into()); }
    let work = force * displacement * angle_deg.to_radians().cos();
    Ok((work, work / time))
}

pub fn momentum_and_impulse(mass: f64, velocity: f64, force: f64, delta_time: f64) -> Result<(f64, f64), String> {
    finite(&[mass, velocity, force, delta_time])?;
    if mass < 0.0 || delta_time < 0.0 { return Err("Mass and time interval must be non-negative".into()); }
    Ok((mass * velocity, force * delta_time))
}

pub fn ohms_law(voltage: f64, resistance: f64) -> Result<(f64, f64), String> {
    finite(&[voltage, resistance])?;
    if resistance == 0.0 { return Err("Resistance must not be zero".into()); }
    Ok((voltage / resistance, voltage * voltage / resistance))
}

pub fn heat_energy(mass: f64, specific_heat: f64, delta_temperature: f64) -> Result<f64, String> {
    finite(&[mass, specific_heat, delta_temperature])?;
    if mass < 0.0 || specific_heat < 0.0 { return Err("Mass and specific heat must be non-negative".into()); }
    Ok(mass * specific_heat * delta_temperature)
}

pub fn wave_values(wavelength: f64, frequency: f64) -> Result<(f64, f64), String> {
    finite(&[wavelength, frequency])?;
    if wavelength < 0.0 || frequency <= 0.0 { return Err("Wavelength must be non-negative and frequency greater than zero".into()); }
    Ok((wavelength * frequency, 1.0 / frequency))
}

pub fn motion(u: f64, a: f64, t: f64) -> Result<MotionResult, String> {
    finite(&[u, a, t])?;
    Ok(MotionResult {
        position: u.mul_add(t, 0.5 * a * t * t),
        velocity: a.mul_add(t, u),
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
    let (sin, cos) = (angle_deg.to_radians()).sin_cos();
    let vx = speed * cos;
    let vy = speed * sin;
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

#[cfg(target_arch = "wasm32")]
mod wasm_api {
    use super::*;
    use wasm_bindgen::prelude::*;

    // Compact numeric arrays minimize JS/WASM boundary serialization overhead.

    #[wasm_bindgen]
    pub fn newton_force_wasm(mass: f64, acceleration: f64) -> Result<f64, JsValue> {
        newton_force(mass, acceleration).map_err(|e| JsValue::from_str(&e))
    }
    #[wasm_bindgen]
    pub fn work_power_wasm(force: f64, displacement: f64, angle_deg: f64, time: f64) -> Result<Vec<f64>, JsValue> {
        let (work, power) = work_and_power(force, displacement, angle_deg, time).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![work, power])
    }
    #[wasm_bindgen]
    pub fn momentum_impulse_wasm(mass: f64, velocity: f64, force: f64, delta_time: f64) -> Result<Vec<f64>, JsValue> {
        let (momentum, impulse) = momentum_and_impulse(mass, velocity, force, delta_time).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![momentum, impulse])
    }
    #[wasm_bindgen]
    pub fn ohms_law_wasm(voltage: f64, resistance: f64) -> Result<Vec<f64>, JsValue> {
        let (current, power) = ohms_law(voltage, resistance).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![current, power])
    }
    #[wasm_bindgen]
    pub fn heat_energy_wasm(mass: f64, specific_heat: f64, delta_temperature: f64) -> Result<f64, JsValue> {
        heat_energy(mass, specific_heat, delta_temperature).map_err(|e| JsValue::from_str(&e))
    }
    #[wasm_bindgen]
    pub fn wave_values_wasm(wavelength: f64, frequency: f64) -> Result<Vec<f64>, JsValue> {
        let (speed, period) = wave_values(wavelength, frequency).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![speed, period])
    }

    #[wasm_bindgen]
    pub fn motion_wasm(u: f64, a: f64, t: f64) -> Result<Vec<f64>, JsValue> {
        let value = motion(u, a, t).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![value.position, value.velocity, value.acceleration])
    }

    #[wasm_bindgen]
    pub fn kinetic_energy_wasm(mass: f64, speed: f64) -> Result<f64, JsValue> {
        kinetic_energy(mass, speed).map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn projectile_wasm(speed: f64, angle_deg: f64, gravity: f64) -> Result<Vec<f64>, JsValue> {
        let value = projectile(speed, angle_deg, gravity).map_err(|e| JsValue::from_str(&e))?;
        Ok(vec![value.range, value.flight_time, value.max_height, value.vx, value.vy, value.impact_speed])
    }
}

#[cfg(test)]
mod tests {
    use super::*;


    #[test]
    fn extended_calculators_validate_and_compute() {
        assert_eq!(newton_force(2.0, 3.0).unwrap(), 6.0);
        assert_eq!(work_and_power(20.0, 5.0, 0.0, 4.0).unwrap(), (100.0, 25.0));
        assert_eq!(momentum_and_impulse(0.5, 8.0, 10.0, 0.2).unwrap(), (4.0, 2.0));
        assert_eq!(ohms_law(12.0, 6.0).unwrap(), (2.0, 24.0));
        assert_eq!(heat_energy(1.0, 4200.0, 10.0).unwrap(), 42000.0);
        assert_eq!(wave_values(2.0, 5.0).unwrap(), (10.0, 0.2));
        assert!(ohms_law(12.0, 0.0).is_err());
        assert!(work_and_power(1.0, 1.0, 0.0, 0.0).is_err());
    }

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
