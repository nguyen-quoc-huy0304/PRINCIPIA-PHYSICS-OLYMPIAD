from __future__ import annotations

import json
import os
import secrets
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import Error as PlaywrightError, sync_playwright

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
HOST, PORT = "127.0.0.1", 4317
TOKEN = secrets.token_urlsafe(32)
MAX_BODY = 64 * 1024
MAX_TEXT = 30000
PROFILE = Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local"))) / "PRINCIPIA" / "EdgeControlProfile"
logs: dict[int, list[dict[str, str]]] = {}
context = None


def edge_path() -> Path:
    candidates = [
        os.environ.get("EDGE_PATH"),
        str(Path(os.environ.get("PROGRAMFILES(X86)", "C:/Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe"),
        str(Path(os.environ.get("PROGRAMFILES", "C:/Program Files")) / "Microsoft/Edge/Application/msedge.exe"),
        str(Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/Edge/Application/msedge.exe"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise RuntimeError("Không tìm thấy Microsoft Edge. Hãy cài Edge hoặc đặt biến EDGE_PATH.")


def attach_logs(page) -> None:
    key = id(page)
    if key in logs:
        return
    logs[key] = []

    def add(kind: str, message: str) -> None:
        entries = logs[key]
        entries.append({
            "time": datetime.now(timezone.utc).isoformat(),
            "type": kind,
            "message": str(message)[:2000],
        })
        del entries[:-250]

    page.on("console", lambda message: add(message.type, message.text))
    page.on("pageerror", lambda error: add("pageerror", str(error)))
    page.on("requestfailed", lambda request: add("requestfailed", f"{request.url} — {request.failure}"))


def pages():
    return context.pages if context else []


def get_page(tab_id: object):
    if not isinstance(tab_id, str) or not tab_id.isdigit() or len(tab_id) > 3:
        raise ValueError("tabId không hợp lệ.")
    index = int(tab_id)
    current = pages()
    if index >= len(current):
        raise LookupError("Tab không còn tồn tại. Hãy tải lại danh sách tab.")
    return current[index]


def valid_url(value: object) -> bool:
    if not isinstance(value, str) or len(value) > 2048:
        return False
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.hostname) and not parsed.username and not parsed.password


def valid_selector(value: object) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > 1000:
        raise ValueError("CSS selector phải có từ 1 đến 1000 ký tự.")
    return value


class Handler(BaseHTTPRequestHandler):
    server_version = "PRINCIPIA-Local/1.0"

    def log_message(self, fmt, *args):
        print(f"[HTTP] {self.address_string()} {fmt % args}")

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def authorize(self, api: bool = False) -> bool:
        if self.headers.get("Host") not in (f"127.0.0.1:{PORT}", f"localhost:{PORT}"):
            self.send_json(403, {"error": "Host không được phép."})
            return False
        origin = self.headers.get("Origin")
        if origin:
            parsed = urlparse(origin)
            if parsed.scheme not in ("http", "https") or parsed.netloc != self.headers.get("Host"):
                self.send_json(403, {"error": "Origin không được phép."})
                return False
        if api and not (self.path == "/api/session" and self.command == "GET"):
            if not secrets.compare_digest(self.headers.get("X-PRINCIPIA-Token", ""), TOKEN):
                self.send_json(401, {"error": "Phiên điều khiển không hợp lệ."})
                return False
        return True

    def read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > MAX_BODY:
            raise ValueError("Dữ liệu gửi lên vượt giới hạn 64 KB.")
        raw = self.rfile.read(length)
        value = json.loads(raw or b"{}")
        if not isinstance(value, dict):
            raise ValueError("JSON body phải là object.")
        return value

    def do_GET(self):
        if not self.authorize(self.path.startswith("/api/")):
            return
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/session":
                return self.send_json(200, {"token": TOKEN})
            if parsed.path == "/api/status":
                return self.send_json(200, {"connected": context is not None, "browser": "Microsoft Edge", "tabs": len(pages()), "profile": str(PROFILE)})
            if parsed.path == "/api/tabs":
                tabs = [{"id": str(i), "title": page.title(), "url": page.url} for i, page in enumerate(pages())]
                return self.send_json(200, {"tabs": tabs})
            if parsed.path == "/api/logs":
                tab_id = parse_qs(parsed.query).get("tabId", [""])[0]
                page = get_page(tab_id)
                return self.send_json(200, {"logs": logs.get(id(page), [])})
            if parsed.path in ("/", "/index.html"):
                data = (PUBLIC / "index.html").read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                return self.wfile.write(data)
            return self.send_json(404, {"error": "Không tìm thấy đường dẫn."})
        except Exception as error:
            return self.send_error_json(error)

    def do_POST(self):
        if not self.authorize(api=True):
            return
        try:
            body = self.read_body()
            route = urlparse(self.path).path
            if route == "/api/tabs/open":
                url = body.get("url")
                if not valid_url(url):
                    return self.send_json(400, {"error": "Chỉ chấp nhận URL HTTP hoặc HTTPS hợp lệ."})
                page = context.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                return self.send_json(200, {"ok": True, "title": page.title(), "url": page.url})
            if route == "/api/tabs/inspect":
                page = get_page(body.get("tabId"))
                result = page.evaluate("""max => ({
                    title: document.title, url: location.href,
                    text: (document.body?.innerText || '').slice(0, max),
                    links: Array.from(document.querySelectorAll('a[href]')).slice(0, 100).map(a => ({
                        text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 160),
                        href: a.href
                    }))
                })""", MAX_TEXT)
                return self.send_json(200, result)
            if route == "/api/actions/click":
                page = get_page(body.get("tabId"))
                page.locator(valid_selector(body.get("selector"))).first.click(timeout=10000)
                return self.send_json(200, {"ok": True, "url": page.url})
            if route == "/api/actions/fill":
                value = body.get("value")
                if not isinstance(value, str) or len(value) > 10000:
                    return self.send_json(400, {"error": "Nội dung nhập phải là chuỗi tối đa 10.000 ký tự."})
                page = get_page(body.get("tabId"))
                page.locator(valid_selector(body.get("selector"))).first.fill(value, timeout=10000)
                return self.send_json(200, {"ok": True})
            if route == "/api/actions/reload":
                page = get_page(body.get("tabId"))
                page.reload(wait_until="domcontentloaded", timeout=30000)
                return self.send_json(200, {"ok": True, "url": page.url})
            if route == "/api/screenshot":
                page = get_page(body.get("tabId"))
                import base64
                image = base64.b64encode(page.screenshot(type="png", full_page=False)).decode("ascii")
                return self.send_json(200, {"image": "data:image/png;base64," + image})
            if route == "/api/tabs/close":
                get_page(body.get("tabId")).close()
                return self.send_json(200, {"ok": True})
            return self.send_json(404, {"error": "Không tìm thấy API."})
        except ValueError as error:
            return self.send_json(400, {"error": str(error)})
        except LookupError as error:
            return self.send_json(404, {"error": str(error)})
        except (PlaywrightError, OSError, json.JSONDecodeError) as error:
            return self.send_json(500, {"error": "Thao tác thất bại: " + str(error)[:500]})
        except Exception as error:
            return self.send_error_json(error)

    def send_error_json(self, error: Exception):
        return self.send_json(500, {"error": "Thao tác thất bại: " + str(error)[:500]})


def main() -> int:
    global context
    PROFILE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(
            str(PROFILE), executable_path=str(edge_path()), headless=False,
            viewport={"width": 1440, "height": 900},
            args=["--no-first-run", "--no-default-browser-check"],
        )
        for page in context.pages:
            attach_logs(page)
        context.on("page", attach_logs)
        server = HTTPServer((HOST, PORT), Handler)
        server.timeout = 0.2
        print(f"PRINCIPIA Browser Control: http://{HOST}:{PORT}")
        print(f"Edge profile: {PROFILE}")
        print("Nhấn Ctrl+C để dừng.")
        dashboard = context.new_page()
        dashboard.set_content("<script>setTimeout(() => location.replace('http://127.0.0.1:4317'), 300)</script>")
        try:
            # Keep Playwright and request handlers on the same thread.
            # The synchronous Playwright API is not thread-safe.
            while True:
                server.handle_request()
        except KeyboardInterrupt:
            print("\nĐang đóng Edge Control...")
        finally:
            server.server_close()
            context.close()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Không thể khởi động Browser Control: {error}", file=sys.stderr)
        raise SystemExit(1)
