export function isValidHttpUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:")
      && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

export function isLocalHostHeader(value) {
  return value === "127.0.0.1:4317" || value === "localhost:4317";
}

export function isSameOriginRequest(origin, host) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "http:" || parsed.protocol === "https:")
      && parsed.host === host;
  } catch { return false; }
}
