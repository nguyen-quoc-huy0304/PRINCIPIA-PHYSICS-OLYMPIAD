import unittest
from security import is_local_host_header, is_same_origin_request, is_valid_http_url


class SecurityTests(unittest.TestCase):
    def test_http_url_validation(self):
        self.assertTrue(is_valid_http_url("https://example.com"))
        self.assertTrue(is_valid_http_url("http://localhost:3000"))
        self.assertFalse(is_valid_http_url("javascript:alert(1)"))
        self.assertFalse(is_valid_http_url("file:///C:/secret.txt"))
        self.assertFalse(is_valid_http_url("https://user:pass@example.com"))
        self.assertFalse(is_valid_http_url("not a URL"))
        self.assertFalse(is_valid_http_url("x" * 2049))

    def test_host_restriction(self):
        self.assertTrue(is_local_host_header("127.0.0.1:4317"))
        self.assertTrue(is_local_host_header("localhost:4317"))
        self.assertFalse(is_local_host_header("example.com"))

    def test_same_origin(self):
        self.assertTrue(is_same_origin_request("http://127.0.0.1:4317", "127.0.0.1:4317"))
        self.assertFalse(is_same_origin_request("https://evil.example", "127.0.0.1:4317"))
        self.assertTrue(is_same_origin_request(None, "127.0.0.1:4317"))


if __name__ == "__main__":
    unittest.main()
