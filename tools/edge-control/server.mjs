import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { chromium } from "playwright-core";
import { isLocalHostHeader, isSameOriginRequest, isValidHttpUrl } from "./security.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4317;
const HOST = "127.0.0.1";
const TOKEN = crypto.randomBytes(32).toString("hex");
const EDGE_PATH = process.env.EDGE_PATH;
const PROFILE_DIR = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "PRINCIPIA", "EdgeControlProfile");
const MAX_TEXT = 30000;
const logs = new Map();
let context;

function resolveEdgePath() {
  const candidates = [
    EDGE_PATH,
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Microsoft", "Edge", "Application", "msedge.exe")
  ].filter(Boolean);
  const found = candidates.find(candidate => fs.existsSync(candidate));
  if (!found) throw new Error("Không tìm thấy Microsoft Edge. Hãy cài Edge hoặc đặt EDGE_PATH.");
  return found;
}

async function startEdge() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: resolveEdgePath(),
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ["--no-first-run", "--no-default-browser-check"]
  });
  context.on("page", attachPageLogs);
  for (const page of context.pages()) attachPageLogs(page);
}

function attachPageLogs(page) {
  if (logs.has(page)) return;
  const entries = [];
  logs.set(page, entries);
  const add = (type, message) => {
    entries.push({ time: new Date().toISOString(), type, message: String(message).slice(0, 2000) });
    if (entries.length > 250) entries.shift();
  };
  page.on("console", message => add(message.type(), message.text()));
  page.on("pageerror", error => add("pageerror", error.message));
  page.on("requestfailed", request => add("requestfailed", request.url() + " — " + (request.failure()?.errorText || "failed")));
}

function validateTabId(value) {
  if (typeof value !== "string" || !/^\d{1,3}$/.test(value)) {
    const error = new Error("tabId không hợp lệ."); error.status = 400; throw error;
  }
}

function getPage(id) {
  const pages = context?.pages() || [];
  const index = Number.parseInt(id, 10);
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) {
    const error = new Error("Tab không còn tồn tại. Hãy tải lại danh sách tab."); error.status = 404; throw error;
  }
  return pages[index];
}

function validateSelector(value) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 1000) {
    const error = new Error("CSS selector phải có từ 1 đến 1000 ký tự."); error.status = 400; throw error;
  }
  return value;
}

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  if (!isLocalHostHeader(req.headers.host)) return res.status(403).json({ error: "Host không được phép." });
  if (!isSameOriginRequest(req.headers.origin, req.headers.host)) return res.status(403).json({ error: "Origin không được phép." });
  next();
});
app.use(express.json({ limit: "64kb" }));
app.use("/api", (req, res, next) => {
  if (req.path === "/session" && req.method === "GET") return next();
  if (req.get("x-principia-token") !== TOKEN) return res.status(401).json({ error: "Phiên điều khiển không hợp lệ." });
  next();
});
app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));

app.get("/api/session", (_req, res) => res.json({ token: TOKEN }));
app.get("/api/status", (_req, res) => res.json({ connected: Boolean(context), browser: "Microsoft Edge", tabs: context?.pages().length || 0, profile: PROFILE_DIR }));

app.get("/api/tabs", async (_req, res, next) => {
  try {
    const tabs = await Promise.all(context.pages().map(async (page, index) => ({
      id: String(index), title: await page.title().catch(() => "(đang tải)"), url: page.url()
    })));
    res.json({ tabs });
  } catch (error) { next(error); }
});

app.post("/api/tabs/open", async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!isValidHttpUrl(url)) return res.status(400).json({ error: "Chỉ chấp nhận URL HTTP hoặc HTTPS hợp lệ." });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    res.json({ ok: true, title: await page.title(), url: page.url() });
  } catch (error) { next(error); }
});

app.post("/api/tabs/inspect", async (req, res, next) => {
  try {
    const { tabId } = req.body || {}; validateTabId(tabId);
    const page = getPage(tabId);
    const result = await page.evaluate(max => ({
      title: document.title, url: location.href,
      text: (document.body?.innerText || "").slice(0, max),
      links: Array.from(document.querySelectorAll("a[href]")).slice(0, 100).map(a => ({
        text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 160), href: a.href
      }))
    }), MAX_TEXT);
    res.json(result);
  } catch (error) { next(error); }
});

app.post("/api/actions/click", async (req, res, next) => {
  try {
    const { tabId, selector } = req.body || {}; validateTabId(tabId);
    const page = getPage(tabId);
    await page.locator(validateSelector(selector)).first().click({ timeout: 10000 });
    res.json({ ok: true, url: page.url() });
  } catch (error) { next(error); }
});

app.post("/api/actions/fill", async (req, res, next) => {
  try {
    const { tabId, selector, value } = req.body || {}; validateTabId(tabId);
    if (typeof value !== "string" || value.length > 10000) return res.status(400).json({ error: "Nội dung nhập phải là chuỗi tối đa 10.000 ký tự." });
    const page = getPage(tabId);
    await page.locator(validateSelector(selector)).first().fill(value, { timeout: 10000 });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/actions/reload", async (req, res, next) => {
  try {
    const { tabId } = req.body || {}; validateTabId(tabId);
    const page = getPage(tabId);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    res.json({ ok: true, url: page.url() });
  } catch (error) { next(error); }
});

app.get("/api/logs", (req, res, next) => {
  try {
    validateTabId(req.query.tabId);
    res.json({ logs: logs.get(getPage(req.query.tabId)) || [] });
  } catch (error) { next(error); }
});

app.post("/api/screenshot", async (req, res, next) => {
  try {
    const { tabId } = req.body || {}; validateTabId(tabId);
    const image = await getPage(tabId).screenshot({ type: "png", fullPage: false });
    res.json({ image: "data:image/png;base64," + image.toString("base64") });
  } catch (error) { next(error); }
});

app.post("/api/tabs/close", async (req, res, next) => {
  try {
    const { tabId } = req.body || {}; validateTabId(tabId);
    await getPage(tabId).close(); res.json({ ok: true });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({ error: status === 500 ? "Thao tác thất bại: " + error.message : error.message });
});

async function shutdown() {
  try { await context?.close(); } catch {}
  process.exit(0);
}

try {
  await startEdge();
  app.listen(PORT, HOST, async () => {
    console.log("\nPRINCIPIA Edge Control: http://127.0.0.1:" + PORT);
    console.log("Session token: " + TOKEN);
    console.log("Edge profile: " + PROFILE_DIR);
    console.log("Nhấn Ctrl+C để dừng.\n");
    const dashboard = await context.newPage();
    await dashboard.goto("http://127.0.0.1:" + PORT, { waitUntil: "domcontentloaded" });
  });
} catch (error) {
  console.error("Không thể khởi động Edge Control:", error.message);
  process.exitCode = 1;
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
