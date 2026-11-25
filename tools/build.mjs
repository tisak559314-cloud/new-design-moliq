#!/usr/bin/env node
/**
 * Сборка сайта в папку dist/ — её и выкладывает Livops (livops.json: npm ci → npm run build → dist).
 *
 * 1. Код и стили собираются esbuild в файлы с хешем в имени (main-3F2K….js): браузер кэширует их навсегда, а новая
 *    версия получает новое имя — вместо ручных ?v= из старого stamp.py.
 * 2. Данные скачиваются из хранилища (тот же манифест, что читает сайт) — в dist/data/ кладётся копия на случай, если
 *    хранилище у человека не откроется. Хранилище недоступно — сборка падает, и на хостинге остаётся прошлая версия.
 * 3. Каждая страница на трёх языках рисуется заранее тем же кодом, что и в браузере (linkedom вместо браузера):
 *    поисковики и превью ссылок в Telegram видят готовый текст, свой заголовок, описание, картинку и ссылки на
 *    другие языки. В браузере main.js сразу перерисовывает страницу на свежих данных и оживляет кнопки.
 * 4. sitemap.xml, robots.txt, 404.html (на ней открывается любой адрес, которого нет среди готовых страниц) и
 *    _headers (сколько хранить файлы в кэше).
 *
 * Запуск: npm run build. Посмотреть результат как на хостинге: npm run preview (или python3 serve.py --dist).
 * Адрес сайта для ссылок в метатегах — SITE_URL (по умолчанию адрес на Livops).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { parseHTML } from "linkedom";
import { stats, meta } from "./seo.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE = (process.env.SITE_URL || "https://moliq-new-design.livops.app").replace(/\/+$/, "");
const MANIFEST = "https://zlsr1a9rg6d9gcbj.public.blob.vercel-storage.com/data/manifest.json";
/** Файлы данных, которые читает сайт (assets/js/data.js) */
const DATA = ["catalog", "rates", "rates-history", "atms", "atms-home", "gold", "p2p", "complaints", "stocks"];
/** Необязательные файлы: истории цен акций (stocks/<ТИКЕР>.json) — нет их в хранилище, страница бумаги рисуется без графика */
const OPTIONAL_PREFIX = "stocks/";
const LOCALE = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };
const VIEW_TIMEOUT = 6000;

const t0 = Date.now();
const log = (s) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)} с] ${s}`);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const write = (rel, body) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };

// ── 1. Данные ──
async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * i);
    }
  }
}
async function loadData() {
  const m = await getJson(MANIFEST);
  const data = {};
  for (const name of DATA) {
    const f = m.files?.[`${name}.json`];
    // акций в хранилище ещё может не быть (раздел новый): сборка не падает, страницы акций покажут «не загрузились»
    if (!f?.url && name === "stocks") { console.warn("  ! в манифесте нет stocks.json — раздел акций без данных"); continue; }
    if (!f?.url) throw new Error(`в манифесте нет ${name}.json`);
    data[name] = await getJson(f.url);
    write(`data/${name}.json`, JSON.stringify(data[name]));
  }
  // истории цен акций — по файлу на бумагу, по 8 одновременно
  const hist = Object.entries(m.files ?? {}).filter(([n]) => n.startsWith(OPTIONAL_PREFIX));
  for (let i = 0; i < hist.length; i += 8) {
    await Promise.all(hist.slice(i, i + 8).map(async ([n, f]) => {
      const name = n.slice(0, -5);
      try { data[name] = await getJson(f.url); write(`data/${n}`, JSON.stringify(data[name])); } catch (e) { console.warn(`  ! ${n}: ${e.message}`); }
    }));
  }
  log(`данные: ${DATA.length} файлов и ${hist.length} историй цен акций, обновлены ${m.updatedAt}`);
  return data;
}

// ── 2. Код и стили ──
async function bundle() {
  const js = await build({
    entryPoints: [path.join(ROOT, "assets/js/main.js")],
    bundle: true, splitting: true, format: "esm", minify: true, target: "es2020", sourcemap: false,
    outdir: path.join(DIST, "assets/js"), entryNames: "[name]-[hash]", chunkNames: "c/[name]-[hash]",
    metafile: true, legalComments: "none", logLevel: "warning",
  });
  const css = await build({
    entryPoints: [path.join(ROOT, "assets/css/app.css")],
    bundle: true, minify: true, outdir: path.join(DIST, "assets/css"), entryNames: "[name]-[hash]",
    external: ["/assets/*"], metafile: true, logLevel: "warning",
  });
  const entry = (meta, src) => "/" + path.relative(DIST, path.resolve(ROOT, Object.entries(meta.outputs).find(([, o]) => o.entryPoint === src)[0])).split(path.sep).join("/");
  const out = { js: entry(js.metafile, "assets/js/main.js"), css: entry(css.metafile, "assets/css/app.css") };
  const size = Object.values(js.metafile.outputs).reduce((s, o) => s + o.bytes, 0);
  log(`код: ${out.js} (+${Object.keys(js.metafile.outputs).length - 1} частей, всего ${Math.round(size / 1024)} КБ), стили: ${out.css}`);
  return out;
}

function copyStatic() {
  for (const rel of ["assets/banks", "assets/stocks", "assets/icon.svg", "assets/moliq-logo.svg", "assets/og.png"]) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) { if (rel.endsWith("og.png")) console.warn("  ! нет assets/og.png — превью ссылок будет без картинки"); continue; }
    fs.cpSync(src, path.join(DIST, rel), { recursive: true });
  }
}

// ── 3. Страницы ──
/** Все готовые страницы: путь без языка → необязательный канонический путь (если страница — копия другой) */
function routes(db, data) {
  // страницы бумаг — только тех, что торгуются: у снятых с торгов нет текущих данных
  const stocks = (data.stocks?.stocks ?? []).filter((s) => s.status !== "gone").map((s) => [["stocks", s.t]]);
  const r = [[[]], [["credits"]], ...["micro", "consumer", "auto", "mortgage", "edu"].map((t) => [["credits", t]]),
    [["deposits"]], [["cards"]], [["transfers"]],
    [["rates"]], [["rates", "USD"], ["rates"]], [["rates", "EUR"]], [["rates", "RUB"]], [["rates", "gold"]],
    [["stocks"]], ...stocks,
    [["map"]], [["check"]], [["banks"]], [["banks", "complaints"]], ...db.banks.map((b) => [["bank", b.id]]), [["chat"]]];
  return r.map(([p, canon]) => ({ path: p, canon: canon ?? p }));
}

/** Окружение браузера для кода сайта: linkedom плюс заглушки того, чего в нём нет */
function browserEnv(templateHtml) {
  const { window, document } = parseHTML(templateHtml);
  const g = globalThis;
  const def = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  def("window", window);
  def("document", document);
  for (const k of ["HTMLElement", "Element", "Node", "Text", "DocumentFragment", "Event", "CustomEvent", "NodeFilter", "SVGElement", "HTMLInputElement"]) if (window[k]) def(k, window[k]);
  const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() }; };
  def("localStorage", mem());
  def("sessionStorage", mem());
  def("navigator", { language: "ru", userAgent: "moliq-build", geolocation: null });
  def("history", { pushState() {}, replaceState() {}, back() {} });
  def("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  def("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  def("requestAnimationFrame", (cb) => setTimeout(() => cb(Date.now()), 0));
  def("cancelAnimationFrame", (id) => clearTimeout(id));
  def("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  def("getComputedStyle", () => ({ getPropertyValue: () => "" }));
  def("scrollTo", () => {});
  window.scrollTo = () => {};
  // переводчик (i18n.js) без наблюдателя: при сборке переводим готовую страницу целиком
  delete g.MutationObserver;
  const proto = window.HTMLElement.prototype;
  proto.scrollIntoView = () => {};
  if (typeof proto.focus !== "function") proto.focus = () => {};
  // сеть при отрисовке не нужна: данные уже в __MOLIQ_DATA__, а подложку карты и скрипты не грузим
  def("fetch", () => Promise.reject(new Error("сеть при сборке выключена")));
  return document;
}

async function prerender(data, assets) {
  const tpl = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
    .replace('href="/assets/css/app.css"', `href="${assets.css}"`)
    .replace('<script type="module" src="/assets/js/main.js"></script>', `<script type="module" src="${assets.js}"></script>`)
    .replace("</head>", `  <link rel="modulepreload" href="${assets.js}">\n</head>`);
  if (!tpl.includes(assets.js) || !tpl.includes(assets.css)) throw new Error("index.html: не нашёл подключение app.css или main.js");

  const realFetch = globalThis.fetch;
  const document = browserEnv(tpl);
  const bodyHtml = document.body.innerHTML;
  globalThis.__MOLIQ_DATA__ = data;
  const mod = (rel) => import(pathToFileURL(path.join(ROOT, "assets/js", rel)).href);
  const [nav, app, i18n, dataJs] = await Promise.all([mod("nav.js"), mod("app.js"), mod("i18n.js"), mod("data.js")]);
  const db = await dataJs.init();
  const S = stats(db, data);

  const pages = [];
  const urlOf = (p, lang) => SITE + nav.href(nav.pathOf(p), lang);
  const all = routes(db, data);
  for (const lang of nav.LANGS) {
    for (const r of all) {
      const html = await renderPage({ document, bodyHtml, tpl, nav, app, i18n, S, lang, route: r, urlOf });
      const url = nav.href(nav.pathOf(r.path), lang);
      const file = url === "/" ? "index.html" : `${url.slice(1)}.html`;
      write(file, html);
      pages.push({ file, url, lang, route: r });
    }
  }
  // страница «не найдено» и запасной вход для адресов, которых нет среди готовых: каркас, main.js нарисует остальное
  write("404.html", await renderPage({ document, bodyHtml, tpl, nav, app, i18n, S, lang: "ru", route: null, urlOf }));
  globalThis.fetch = realFetch;
  log(`страниц: ${pages.length} (${all.length} адресов × ${nav.LANGS.length} языка) + 404.html`);
  return { pages, all, urlOf };
}

async function renderPage({ document, bodyHtml, tpl, nav, app, i18n, S, lang, route, urlOf }) {
  const p = route?.path ?? ["404"];
  const section = route ? p[0] ?? "" : null;
  nav.setCurrentLang(lang);
  globalThis.location = new URL(SITE + nav.href(nav.pathOf(p), lang));
  document.body.innerHTML = bodyHtml;
  document.body.className = "";
  app.paintChrome(section ?? "", nav.pathOf(p));
  const host = document.createElement("div");
  host.className = "view";
  document.querySelector("#main").replaceChildren(host);
  let off = null;
  if (route) {
    const view = await app.VIEWS[section]();
    let timer;
    const done = Promise.resolve(view.default(host, { section, path: p, query: new URLSearchParams() }))
      .then((f) => { off = f; return true; }, (e) => { console.warn(`  ! /${p.join("/")} (${lang}): ${e.message}`); return true; });
    const ok = await Promise.race([done, new Promise((r) => { timer = setTimeout(() => r(false), VIEW_TIMEOUT); })]);
    clearTimeout(timer);
    if (!ok) console.warn(`  ! /${p.join("/")} (${lang}): страница рисуется дольше ${VIEW_TIMEOUT / 1000} с — беру то, что успело`);
    await sleep(20); // догрузки после первой отрисовки (счётчики, подсказки)
  } else {
    host.innerHTML = `<div class="wrap page"><div class="empty"><b class="h3">Страница не найдена</b><span class="muted small">Возможно, ссылка устарела</span><a class="btn btn-primary btn-sm" href="#/">На главную</a></div></div>`;
  }
  nav.localizeLinks(document.body);
  i18n.setLang(lang);
  i18n.translateTree(document.body);
  // страница целиком, уже переведённая (вместе с «К содержанию», подписями панелей и т. п.)
  const body = { html: document.body.innerHTML, cls: document.body.className };
  try { off?.(); } catch { /* вид уже снят */ }

  const m = route ? meta(S, p, lang) : { title: `${i18n.tr("Страница не найдена")} — Moliq`, description: "", noindex: true };
  const canon = route ? urlOf(route.canon, lang) : null;
  const head = [
    `<title>${esc(m.title)}</title>`,
    m.description && `<meta name="description" content="${esc(m.description)}">`,
    m.noindex && `<meta name="robots" content="noindex">`,
    canon && `<link rel="canonical" href="${esc(canon)}">`,
    ...(route && !m.noindex ? [...nav.LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(urlOf(route.canon, l))}">`), `<link rel="alternate" hreflang="x-default" href="${esc(urlOf(route.canon, "ru"))}">`] : []),
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Moliq">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    m.description && `<meta property="og:description" content="${esc(m.description)}">`,
    canon && `<meta property="og:url" content="${esc(canon)}">`,
    `<meta property="og:image" content="${SITE}/assets/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="${LOCALE[lang]}">`,
    ...nav.LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${LOCALE[l]}">`),
    `<meta name="twitter:card" content="summary_large_image">`,
  ].filter(Boolean).map((s) => `  ${s}`).join("\n");

  const html = tpl
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/\s*<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, `\n${head}`)
    .replace(/<body>[\s\S]*<\/body>/, () => `<body${body.cls ? ` class="${esc(body.cls)}"` : ""}>${body.html}</body>`);
  if (!html.includes('<link rel="canonical"') && route) throw new Error("index.html: не нашёл <title> и описание, куда вставить метатеги");
  return html;
}

// ── 4. Карта сайта, robots, кэш ──
function seoFiles({ pages, all, urlOf }) {
  const indexable = all.filter((r) => r.canon === r.path && r.path[0] !== "chat");
  const today = new Date().toISOString().slice(0, 10);
  const urls = indexable.flatMap((r) => ["ru", "uz", "en"].map((lang) => `  <url>
    <loc>${esc(urlOf(r.path, lang))}</loc>
    <lastmod>${today}</lastmod>
${["ru", "uz", "en"].map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(urlOf(r.path, l))}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlOf(r.path, "ru"))}"/>
  </url>`));
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`);
  write("robots.txt", `User-agent: *
Allow: /
Disallow: /chat
Disallow: /uz/chat
Disallow: /en/chat

Sitemap: ${SITE}/sitemap.xml
`);
  // файлы с хешем в имени не меняются никогда; страницы и данные — проверяем часто, чтобы правки были видны сразу
  write("_headers", `/assets/js/*
  Cache-Control: public, max-age=31536000, immutable
/assets/css/*
  Cache-Control: public, max-age=31536000, immutable
/assets/banks/*
  Cache-Control: public, max-age=604800
/assets/stocks/*
  Cache-Control: public, max-age=604800
/data/*
  Cache-Control: public, max-age=300
/*.html
  Cache-Control: public, max-age=0, must-revalidate
`);
  // адрес вида /credits, у которого есть и подстраницы (/credits/micro): кладём ту же страницу ещё и как
  // credits/index.html — так она откроется и там, где хостинг сначала ищет папку
  let dirs = 0;
  for (const p of pages) {
    const dir = path.join(DIST, p.file.replace(/\.html$/, ""));
    if (p.file !== "index.html" && fs.existsSync(dir) && fs.statSync(dir).isDirectory()) { fs.copyFileSync(path.join(DIST, p.file), path.join(dir, "index.html")); dirs++; }
  }
  log(`sitemap.xml: ${urls.length} адресов; robots.txt, _headers; копий для папок: ${dirs}`);
}

async function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const [data, assets] = await Promise.all([loadData(), bundle()]);
  copyStatic();
  const result = await prerender(data, assets);
  seoFiles(result);
  log("готово: dist/");
}

main().then(() => process.exit(0), (e) => { console.error(`✗ сборка не удалась: ${e.stack || e.message}`); process.exit(1); });
