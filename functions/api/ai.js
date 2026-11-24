const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const MAX_BODY = 24_000;
const MAX_MESSAGES = 18;
const MAX_TEXT = 8_000;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
function validText(value, max = MAX_TEXT) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
async function verifyFirebaseUser(request, env) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || token.length > 5000) throw new Error("UNAUTHORIZED");
  const apiKey = env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("SERVER_CONFIG");
  const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const data = await response.json();
  const user = data.users?.[0];
  if (!user?.localId || user.disabled) throw new Error("UNAUTHORIZED");
  return { uid: user.localId, email: user.email || "" };
}
function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
    throw new Error("INVALID_MESSAGES");
  }
  const allowed = new Set(["user", "assistant"]);
  return messages.map(message => {
    if (!message || !allowed.has(message.role) || !validText(message.content, MAX_TEXT)) {
      throw new Error("INVALID_MESSAGES");
    }
    return { role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content.trim() }] };
  });
}
export async function onRequestPost({ request, env }) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Origin không hợp lệ." }, 403);
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY) return json({ error: "Yêu cầu quá lớn." }, 413);
  try {
    const user = await verifyFirebaseUser(request, env);
    if (!env.GEMINI_API_KEY) return json({ error: "Máy chủ chưa cấu hình Gemini API key." }, 503);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "Yêu cầu quá lớn." }, 413);
    const input = JSON.parse(raw);
    if (!validText(input.system, 6000)) return json({ error: "Thiếu hướng dẫn hệ thống hợp lệ." }, 400);
    const contents = normalizeMessages(input.messages);
    const model = "gemini-2.5-flash";
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system.trim() }] },
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 1400 }
      })
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      return json({ error: upstream.status === 429 ? "AI đang quá tải hoặc đã đạt giới hạn lượt gọi." : "Google Gemini không thể xử lý yêu cầu lúc này." }, status);
    }
    const answer = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("").trim();
    if (!answer) return json({ error: "Gemini không trả về nội dung. Hãy thử gửi lại." }, 502);
    return json({ answer, provider: "Google Gemini", model, requestId: crypto.randomUUID(), user: user.uid });
  } catch (error) {
    const code = error?.message || "";
    if (code === "UNAUTHORIZED") return json({ error: "Phiên đăng nhập hết hạn. Hãy đăng nhập lại." }, 401);
    if (code === "SERVER_CONFIG") return json({ error: "Máy chủ chưa cấu hình Firebase Web API key." }, 503);
    if (code === "INVALID_MESSAGES") return json({ error: "Lịch sử hội thoại không hợp lệ hoặc quá dài." }, 400);
    if (error instanceof SyntaxError) return json({ error: "Dữ liệu gửi lên không phải JSON hợp lệ." }, 400);
    console.error("PRINCIPIA Gemini proxy error:", error);
    return json({ error: "Không thể kết nối dịch vụ AI. Hãy thử lại sau." }, 500);
  }
}
