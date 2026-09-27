"""Local preview with clean section URLs: python dev-server.py  →  http://localhost:5510"""
import http.server

ROUTES = {"services", "website-plans", "portfolio", "why-custom-code", "process", "faq", "contact"}
PORT = 5510


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0].strip("/") in ROUTES:
            self.path = "/index.html"
        return super().do_GET()


http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
    print(f"Serving on http://localhost:{PORT}")
    httpd.serve_forever()
