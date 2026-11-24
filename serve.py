"""Локальный сервер для разработки: python3 serve.py → http://localhost:4321

Отдаёт исходники из этой папки без кэша, чтобы правки были видны сразу. Адреса страниц — чистые пути (/credits,
/uz/rates/gold): для пути без расширения файла отдаётся index.html, а страницу рисует main.js.
Собранный сайт (как на хостинге) смотреть так: npm run build && python3 serve.py --dist
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.realpath(__file__))
DIST = "--dist" in sys.argv
BASE = os.path.join(ROOT, "dist") if DIST else ROOT
PORT = next((int(a) for a in sys.argv[1:] if a.isdigit()), 4321)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        last = path.rstrip("/").rsplit("/", 1)[-1]
        if "." not in last:
            if DIST:
                # как на Livops: /credits → credits.html, / → index.html, нет файла → 404.html
                rel = path.strip("/") or "index"
                self.path = "/" + rel + ".html" if os.path.isfile(os.path.join(BASE, rel + ".html")) else "/404.html"
            elif not os.path.isfile(os.path.join(BASE, path.lstrip("/"))):
                self.path = "/index.html"
        return super().send_head()

    def log_message(self, *args):  # тишина в консоли
        pass


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=BASE))
    print(f"Moliq{' (собранный)' if DIST else ''}: http://localhost:{PORT}", flush=True)
    server.serve_forever()
