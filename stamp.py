#!/usr/bin/env python3
"""Версии файлов в index.html — запускать перед каждым пушем: python3 stamp.py

Хостинг отдаёт всё из assets/ с кэшем на год (Cache-Control: immutable), а сборки с именами-хешами у сайта нет.
Без версий у тех, кто уже заходил, после обновления смешиваются старые и новые скрипты. Поэтому к каждому файлу
дописывается ?v=<хеш содержимого>: стилям и главному скрипту — прямо в index.html, остальным модулям — через
карту импортов (importmap), так что сами модули и их import "./lib.js" менять не нужно.
Файл не изменился — его адрес тот же, и браузер берёт его из кэша.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"


def ver(path: Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:10]


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    scripts = sorted((ROOT / "assets/js").rglob("*.js"))
    urls = {f"./{p.relative_to(ROOT).as_posix()}": f"./{p.relative_to(ROOT).as_posix()}?v={ver(p)}" for p in scripts}
    importmap = '<script type="importmap">' + json.dumps({"imports": urls}, ensure_ascii=False, separators=(",", ":")) + "</script>"

    css = f'assets/css/app.css?v={ver(ROOT / "assets/css/app.css")}'
    app = urls["./assets/js/app.js"][2:]
    html, n1 = re.subn(r'<link rel="stylesheet" href="assets/css/app\.css[^"]*">', f'<link rel="stylesheet" href="{css}">', html)
    html = re.sub(r'\s*<script type="importmap">.*?</script>', "", html, flags=re.S)
    html, n2 = re.subn(r'<script type="module" src="assets/js/app\.js[^"]*"></script>', f'{importmap}\n  <script type="module" src="{app}"></script>', html)
    if n1 != 1 or n2 != 1:
        raise SystemExit("index.html: не нашёл подключение стилей или главного скрипта — проверьте разметку")
    INDEX.write_text(html, encoding="utf-8")
    print(f"index.html: версии проставлены ({len(scripts)} скриптов, стили {css.split('=')[1]})")


if __name__ == "__main__":
    main()
