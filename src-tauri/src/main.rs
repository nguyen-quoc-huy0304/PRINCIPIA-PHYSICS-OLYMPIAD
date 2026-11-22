#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod physics;

#[tauri::command]
fn physics_motion(u: f64, a: f64, t: f64) -> Result<physics::MotionResult, String> {
    physics::motion(u, a, t)
}

#[tauri::command]
fn physics_kinetic_energy(mass: f64, speed: f64) -> Result<f64, String> {
    physics::kinetic_energy(mass, speed)
}

#[tauri::command]
fn physics_projectile(speed: f64, angle_deg: f64, gravity: Option<f64>) -> Result<physics::ProjectileResult, String> {
    physics::projectile(speed, angle_deg, gravity.unwrap_or(9.80665))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            physics_motion,
            physics_kinetic_energy,
            physics_projectile
        ])
        .run(tauri::generate_context!())
        .expect("error while running PRINCIPIA");
}
