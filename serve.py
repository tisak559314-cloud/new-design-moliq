"""Локальный сервер макета: python3 serve.py → http://localhost:4321
Отдаёт файлы из этой папки и запрещает кэш, чтобы правки были видны сразу."""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.realpath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4321


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):  # тишина в консоли
        pass


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT))
    print(f"Moliq, новый дизайн: http://localhost:{PORT}", flush=True)
    server.serve_forever()
