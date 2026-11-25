const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
const MAX_BODY_BYTES = 64 * 1024;
const OPERATIONS = Object.freeze({
  velocity: ["initial", "acceleration", "seconds"],
  displacement: ["initial", "acceleration", "seconds"],
  kineticEnergy: ["massKg", "speedMps"],
  projectileRange: ["speed", "angleDeg", "gravity"],
  projectileMaxHeight: ["speed", "angleDeg", "gravity"],
  gameProjectileScore: ["speed", "angleDeg", "targetM", "gravity"],
  rigidBodyDrop: ["initialHeightM", "gravityMps2", "radiusM", "restitution", "steps"],
  linearRegression: ["points"],
  robotArmIK: ["l1M", "l2M", "targetXM", "targetYM", "elbowBranch"],
  forceBalance: ["x", "y", "targetX", "targetY"]
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function validateRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_REQUEST");
  if (!Object.prototype.hasOwnProperty.call(OPERATIONS, input.op)) throw new Error("UNSUPPORTED_OPERATION");
  const fields = OPERATIONS[input.op];
  const allowed = new Set(["op", "id", ...fields]);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new Error("UNKNOWN_FIELD");
  for (const field of fields) {
    if (!(field in input)) throw new Error("MISSING_FIELD");
    if (field === "points") {
      const points = input.points;
      if (!Array.isArray(points) || points.length < 2 || points.length > 10000 ||
          points.some((pair) => !Array.isArray(pair) || pair.length !== 2 ||
            pair.some((value) => typeof value !== "number" || !Number.isFinite(value)))) {
        throw new Error("INVALID_POINTS");
      }
      continue;
    }
    if (typeof input[field] !== "number" || !Number.isFinite(input[field])) {
      throw new Error("INVALID_NUMBER");
    }
  }
  return input;
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origin not allowed" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request body too large" }, 413);
  const base = String(env.PRINCIPIA_GO_API_URL || "").trim();
  if (!base) return json({ error: "Go compute service is not configured" }, 503);
  let endpoint;
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return json({ error: "Go API URL must use HTTPS" }, 503);
    }
    endpoint = new URL("/v1/compute", parsed);
  } catch {
    return json({ error: "Go API URL is invalid" }, 503);
  }
  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request body too large" }, 413);
    input = validateRequest(JSON.parse(raw));
  } catch (error) {
    const code = error?.message || "";
    const status = code === "UNSUPPORTED_OPERATION" ? 422 : 400;
    return json({ error: code === "UNSUPPORTED_OPERATION" ? "Unsupported operation" : "Invalid compute request" }, status);
  }
  try {
    const upstream = await fetch(endpoint.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000)
    });
    const body = await upstream.text();
    if (body.length > MAX_BODY_BYTES) return json({ error: "Go API response too large" }, 502);
    let parsed;
    try { parsed = JSON.parse(body); }
    catch { return json({ error: "Go API returned invalid JSON" }, 502); }
    if (!parsed || typeof parsed !== "object" || typeof parsed.ok !== "boolean") {
      return json({ error: "Go API response contract is invalid" }, 502);
    }
    return json(parsed, upstream.status);
  } catch {
    return json({ error: "Go compute service unavailable" }, 502);
  }
}
