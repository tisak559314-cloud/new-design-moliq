// Адреса сайта. Язык — в начале пути: /uz/credits, /en/credits; русский — без приставки: /credits.
// В коде страниц внутренние ссылки пишутся коротко — href="#/credits?bank=kapital". localizeLinks превращает их
// в настоящие адреса текущего языка (/uz/credits?bank=kapital): такие ссылки видят поисковики и Telegram,
// их можно открыть в новой вкладке и переслать.

export const LANGS = ["ru", "uz", "en"];
export const DEFAULT_LANG = "ru";
/** Предпочтение языка между заходами (выбор в меню языка) */
export const LANG_KEY = "moliq-lang";

let current = DEFAULT_LANG;
export const lang = () => current;
export const setCurrentLang = (l) => { current = LANGS.includes(l) ? l : DEFAULT_LANG; };
export const prefix = (l = current) => (l === DEFAULT_LANG ? "" : `/${l}`);

/** «#/credits?x=1», «/credits?x=1» или «credits» → адрес на языке l: /uz/credits?x=1. Главная — «/» или «/uz» */
export function href(to, l = current) {
  const p = String(to ?? "").replace(/^#/, "").replace(/^\/?/, "/");
  const [path, q = ""] = p.split("?");
  const clean = path.replace(/\/+$/, "");
  return (prefix(l) + clean || "/") + (q ? `?${q}` : "");
}

/** Адрес → { lang, path: ["credits", "micro"], query }. Понимает и файлы вида /credits.html */
export function parse(pathname, search = "") {
  const segs = String(pathname).replace(/\.html$/, "").split("/").filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  let l = DEFAULT_LANG;
  if (LANGS.includes(segs[0]) && segs[0] !== DEFAULT_LANG) l = segs.shift();
  if (segs[0] === "index") segs.shift();
  return { lang: l, path: segs, query: new URLSearchParams(search) };
}

/** Путь страницы без языка — для меню языка и метатегов: ["credits","micro"] + query → «/credits/micro?…» */
export const pathOf = (path, query) => `/${path.join("/")}${query && String(query) ? `?${query}` : ""}`;

/** Короткие ссылки href="#/…" внутри узла (и сам узел) → настоящие адреса текущего языка */
export function localizeLinks(node) {
  if (!node || node.nodeType !== 1) return;
  const fix = (a) => { const h = a.getAttribute("href"); if (h && h.startsWith("#/")) a.setAttribute("href", href(h)); };
  if (node.matches?.('a[href^="#/"]')) fix(node);
  for (const a of node.querySelectorAll('a[href^="#/"]')) fix(a);
}

// Переход внутри сайта без перезагрузки. Его подключает main.js; до этого (и при сборке) — обычный переход.
let navigate = (to) => { location.href = href(to); };
export const setNavigator = (fn) => { navigate = fn; };
/** Перейти на «#/credits» или «/credits» текущего языка */
export const go = (to) => navigate(to);
