const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
const MAX_BODY_BYTES = 8 * 1024;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid");
  const allowed = new Set(["speedMps", "angleDeg", "gravityMps2", "samples"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new Error("invalid");
  const { speedMps, angleDeg, gravityMps2, samples } = input;
  if (![speedMps, angleDeg, gravityMps2, samples].every(Number.isFinite) ||
      speedMps <= 0 || gravityMps2 <= 0 || angleDeg < 0 || angleDeg > 90 ||
      !Number.isInteger(samples) || samples < 2 || samples > 512) throw new Error("invalid");
  return { speedMps, angleDeg, gravityMps2, samples };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origin not allowed" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return json({ error: "Request body too large" }, 413);
  }
  const base = String(env.PRINCIPIA_GO_API_URL || "").trim();
  if (!base) return json({ error: "Go compute service is not configured" }, 503);
  let endpoint;
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return json({ error: "Go API URL must use HTTPS" }, 503);
    }
    endpoint = new URL("/v1/game/trajectory", parsed);
  } catch {
    return json({ error: "Go API URL is invalid" }, 503);
  }
  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request body too large" }, 413);
    input = validate(JSON.parse(raw));
  } catch {
    return json({ error: "Invalid trajectory request" }, 400);
  }
  try {
    const upstream = await fetch(endpoint.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000)
    });
    const body = await upstream.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return json({ error: "Go API response too large" }, 502);
    let result;
    try { result = JSON.parse(body); }
    catch { return json({ error: "Go API returned invalid JSON" }, 502); }
    if (upstream.ok && (!result || !Array.isArray(result.points) || result.points.length !== input.samples ||
        ![result.flightTimeS, result.rangeM, result.maxHeightM].every(Number.isFinite) ||
        result.points.some((point) => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)))) {
      return json({ error: "Go API trajectory response is invalid" }, 502);
    }
    return json(result, upstream.status);
  } catch {
    return json({ error: "Go trajectory service unavailable" }, 502);
  }
}
