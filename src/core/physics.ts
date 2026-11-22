import { invoke, isTauri } from '@tauri-apps/api/core';
import {
  motion_wasm,
  kinetic_energy_wasm,
  projectile_wasm,
  newton_force_wasm,
  work_power_wasm,
  momentum_impulse_wasm,
  ohms_law_wasm,
  heat_energy_wasm,
  wave_values_wasm
} from '../wasm/pkg/physics_core';

export type MotionResult = {
  position: number;
  velocity: number;
  acceleration: number;
};

export type ProjectileResult = {
  range: number;
  flight_time: number;
  max_height: number;
  vx: number;
  vy: number;
  impact_speed: number;
};

const finite = (...values: number[]) => {
  if (!values.every(Number.isFinite)) throw new TypeError('Các giá trị phải là số hữu hạn.');
};

// wasm-pack's "bundler" target statically imports and initializes the
// WebAssembly module; it exports the Rust functions directly, with no default
// async initializer. Vite's wasm plugin handles the generated ESM/WASM import.
function loadWasm(): Promise<void> {
  return Promise.resolve();
}

async function browserWasm<T>(run: () => T, fallback: () => T): Promise<T> {
  try {
    await loadWasm();
    return run();
  } catch {
    // Keep the web app usable when WebAssembly is unavailable or blocked.
    return fallback();
  }
}

export async function calculateMotion(u: number, a: number, t: number): Promise<MotionResult> {
  finite(u, a, t);
  if (isTauri()) return invoke<MotionResult>('physics_motion', { u, a, t });
  return browserWasm(
    () => {
      const result = motion_wasm(u, a, t);
      return { position: result[0], velocity: result[1], acceleration: result[2] };
    },
    () => ({ position: u * t + 0.5 * a * t * t, velocity: u + a * t, acceleration: a })
  );
}

export async function calculateKineticEnergy(mass: number, speed: number): Promise<number> {
  finite(mass, speed);
  if (mass < 0 || speed < 0) throw new RangeError('Khối lượng và tốc độ không được âm.');
  if (isTauri()) return invoke<number>('physics_kinetic_energy', { mass, speed });
  return browserWasm(
    () => kinetic_energy_wasm(mass, speed),
    () => 0.5 * mass * speed * speed
  );
}

export async function calculateProjectile(
  speed: number, angleDeg: number, gravity = 9.80665
): Promise<ProjectileResult> {
  finite(speed, angleDeg, gravity);
  if (speed < 0 || angleDeg < 0 || angleDeg > 90 || gravity <= 0) {
    throw new RangeError('Góc phóng phải từ 0 đến 90°, tốc độ không âm và g > 0.');
  }
  if (isTauri()) {
    return invoke<ProjectileResult>('physics_projectile', { speed, angleDeg, gravity });
  }
  return browserWasm(
    () => {
      const result = projectile_wasm(speed, angleDeg, gravity);
      return {
        range: result[0],
        flight_time: result[1],
        max_height: result[2],
        vx: result[3],
        vy: result[4],
        impact_speed: result[5]
      };
    },
    () => {
      const angle = angleDeg * Math.PI / 180;
      const vx = speed * Math.cos(angle);
      const vy = speed * Math.sin(angle);
      const flight_time = 2 * vy / gravity;
      return {
        range: vx * flight_time,
        flight_time,
        max_height: vy * vy / (2 * gravity),
        vx,
        vy,
        impact_speed: speed
      };
    }
  );
}


export type AdvancedPhysicsTool = 'newton' | 'work' | 'momentum' | 'ohm' | 'thermal' | 'wave';
export type AdvancedPhysicsResult = number[];

/** Run the advanced calculator kernels in the shared Rust/WASM core. */
export async function calculateAdvancedPhysics(
  tool: AdvancedPhysicsTool,
  values: number[]
): Promise<AdvancedPhysicsResult> {
  finite(...values);
  return browserWasm(() => {
    switch (tool) {
      case 'newton':
        return [newton_force_wasm(values[0], values[1])];
      case 'work':
        return Array.from(work_power_wasm(values[0], values[1], values[2], values[3]));
      case 'momentum':
        return Array.from(momentum_impulse_wasm(values[0], values[1], values[2], values[3]));
      case 'ohm':
        return Array.from(ohms_law_wasm(values[0], values[1]));
      case 'thermal':
        return [heat_energy_wasm(values[0], values[1], values[2])];
      case 'wave':
        return Array.from(wave_values_wasm(values[0], values[1]));
    }
  }, () => {
    const [a, b, c, d] = values;
    switch (tool) {
      case 'newton': return [a * b];
      case 'work': { const work = a * b * Math.cos(c * Math.PI / 180); return [work, work / d]; }
      case 'momentum': return [a * b, c * d];
      case 'ohm': return [a / b, a * a / b];
      case 'thermal': return [a * b * c];
      case 'wave': return [a * b, 1 / b];
    }
  });
}
