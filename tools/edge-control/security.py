from urllib.parse import urlparse


def is_valid_http_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return False
    try:
        parsed = urlparse(value)
        return parsed.scheme in ("http", "https") and bool(parsed.hostname) and not parsed.username and not parsed.password
    except ValueError:
        return False


def is_local_host_header(value):
    return value in ("127.0.0.1:4317", "localhost:4317")


def is_same_origin_request(origin, host):
    if not origin:
        return True
    try:
        parsed = urlparse(origin)
        return parsed.scheme in ("http", "https") and parsed.netloc == host
    except ValueError:
        return False
