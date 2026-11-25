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

async function requestGo(path, payload) {
  if (typeof fetch !== 'function') throw new Error('Go API is unavailable');
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.error || 'Go API request failed');
  return body;
}

function validateTrajectory(points, samples) {
  if (!Array.isArray(points) || points.length !== samples ||
      points.some((point) => !Array.isArray(point) ||
        point.length !== 2 || !point.every(Number.isFinite))) {
    throw new Error('Native core returned an invalid trajectory');
  }
  return points;
}

export async function getTrajectory(speed, angle, gravity, samples = 49) {
  try {
    const result = await requestGo('/api/game/trajectory', {
      speedMps: speed, angleDeg: angle, gravityMps2: gravity, samples,
    });
    const points = result.points.map((point) => [point.x, point.y]);
    return validateTrajectory(points, samples);
  } catch (goError) {
    const wasm = await loadGameCore();
    const raw = wasm.game_trajectory_json(speed, angle, gravity, samples);
    return validateTrajectory(JSON.parse(raw), samples);
  }
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
  try {
    const response = await requestGo('/api/compute', {
      op: 'gameProjectileScore', speed, angleDeg: angle, targetM: target, gravity,
    });
    const result = response.value;
    if (!result || ![result.rangeM, result.errorM, result.points].every(Number.isFinite) || result.points < 0) {
      throw new Error('Go API returned an invalid score');
    }
    return result;
  } catch (goError) {
    const wasm = await loadGameCore();
    const result = JSON.parse(wasm.score_projectile_json(speed, angle, target, gravity));
    if (!result || ![result.rangeM, result.errorM, result.points].every(Number.isFinite) || result.points < 0) {
      throw new Error('Rust returned an invalid score');
    }
    return result;
  }
}

export async function generateChallenge(seed) {
  const wasm = await loadGameCore();
  return JSON.parse(wasm.generate_game_challenge_json(seed));
}
