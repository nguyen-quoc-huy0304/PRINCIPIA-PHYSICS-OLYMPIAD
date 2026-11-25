/* PRINCIPIA game WASM adapter: domain calculations stay in Rust. */
let corePromise;

export async function loadGameCore() {
  if (!corePromise) {
    corePromise = import('/assets/wasm/pkg/principia_core.js')
      .then(async (wasm) => {
        await wasm.default();
        for (const name of [
          'score_projectile_json',
          'generate_game_challenge_json',
          'clamp_game_target',
          'game_trajectory_json',
        ]) {
          if (typeof wasm[name] !== 'function') {
            throw new Error(`Rust/WASM export missing: ${name}`);
          }
        }
        return wasm;
      })
      .catch((error) => {
        corePromise = undefined;
        throw error;
      });
  }
  return corePromise;
}

export async function getTrajectory(speed, angle, gravity, samples = 49) {
  const wasm = await loadGameCore();
  const raw = wasm.game_trajectory_json(speed, angle, gravity, samples);
  const points = JSON.parse(raw);
  if (!Array.isArray(points) || points.length !== samples ||
      points.some((point) => !Array.isArray(point) ||
        point.length !== 2 || !point.every(Number.isFinite))) {
    throw new Error('Rust returned an invalid trajectory');
  }
  return points;
}

export async function clampPlayableTarget(target, speed, gravity) {
  const wasm = await loadGameCore();
  const value = wasm.clamp_game_target(target, speed, gravity);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Rust returned an invalid target');
  }
  return value;
}

export async function scoreShot(speed, angle, target, gravity) {
  const wasm = await loadGameCore();
  const result = JSON.parse(
    wasm.score_projectile_json(speed, angle, target, gravity),
  );
  if (![result.rangeM, result.errorM, result.points].every(Number.isFinite)) {
    throw new Error('Rust returned an invalid score');
  }
  return result;
}

export async function generateChallenge(seed) {
  const wasm = await loadGameCore();
  return JSON.parse(wasm.generate_game_challenge_json(seed));
}
