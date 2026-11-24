// Запуск сайта в браузере: маршруты, переходы без перезагрузки, язык, окна и клавиши.
// Адреса — чистые пути с языком в начале (nav.js). Страница может прийти уже отрисованной при сборке
// (tools/build.mjs): тогда этот код перерисовывает её на свежих данных из хранилища и оживляет кнопки.
import { $, $$ } from "./lib.js";
import { init } from "./data.js";
import { store, save } from "./store.js";
import { setLang, tr } from "./i18n.js";
import { LANGS, LANG_KEY, DEFAULT_LANG, href, parse, pathOf, localizeLinks, setCurrentLang, setNavigator } from "./nav.js";
import { VIEWS, TITLES, paintChrome, paintCompare, openCompare, openSearch, toggleLang, closeLayer } from "./app.js";

const pref = { get: () => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } }, set: (l) => { try { localStorage.setItem(LANG_KEY, l); } catch { /* приватный режим */ } } };

// Старые адреса с решёткой (#/credits?…) — те, что уже разосланы, — переводим на чистые
if (location.hash.startsWith("#/")) history.replaceState(null, "", href(location.hash, parse(location.pathname).lang));
// Главная без языка в адресе: человек раньше выбрал узбекский или английский — открываем её на этом языке
{
  const l = pref.get();
  if (location.pathname === "/" && LANGS.includes(l) && l !== DEFAULT_LANG) history.replaceState(null, "", href("/", l) + location.search);
}

// ── Маршруты ──
// страница пришла уже отрисованной при сборке (у неё есть канонический адрес): первый раз не трогаем её заголовок
// (он подробнее, для поиска и превью) и прокрутку — человек мог начать читать, пока грузились данные
let first = !!document.querySelector('link[rel="canonical"]');
let cleanup = null, lastKey = null, turn = 0;
async function route() {
  const my = ++turn;
  const { lang, path, query } = parse(location.pathname, location.search);
  setCurrentLang(lang);
  const section = Object.hasOwn(VIEWS, path[0] || "") ? path[0] || "" : null;
  const main = $("#main");
  closeLayer();
  $(".lang .menu")?.setAttribute("hidden", "");
  await init();
  const mod = section != null ? await VIEWS[section]() : null;
  if (my !== turn) return; // пока грузили, человек ушёл дальше
  if (cleanup) { try { cleanup(); } catch { /* вид уже снят */ } cleanup = null; }
  const here = pathOf(path, query);
  paintChrome(section ?? "", here);
  setLang(lang);
  if (!first) document.title = section ? `${tr(TITLES[section])} — Moliq` : section === "" ? tr(TITLES[""]) : `${tr("Страница не найдена")} — Moliq`;
  // каждый вид получает свой узел: обработчики прошлой страницы уходят вместе с ним
  const host = document.createElement("div");
  host.className = "view";
  main.replaceChildren(host);
  if (!mod) {
    host.innerHTML = `<div class="wrap page"><div class="empty"><b class="h3">Страница не найдена</b><span class="muted small">Возможно, ссылка устарела</span><a class="btn btn-primary btn-sm" href="#/">На главную</a></div></div>`;
  } else {
    const off = (await mod.default(host, { section, path, query })) || null;
    if (my !== turn) { try { off?.(); } catch { /* вид уже снят */ } return; }
    cleanup = off;
  }
  localizeLinks(document.body);
  const key = `${lang}/${section}`;
  if (key !== lastKey && !first) window.scrollTo(0, 0);
  lastKey = key;
  first = false;
  paintCompare();
}

/** Переход внутри сайта: to — короткая ссылка «#/credits» (текущий язык) или готовый адрес «/uz/credits» */
function navigate(to, { replace = false } = {}) {
  const url = String(to).startsWith("#/") ? href(to) : to;
  if (url === location.pathname + location.search) return;
  history[replace ? "replaceState" : "pushState"](null, "", url);
  route();
}
setNavigator((to) => navigate(to));

// новые ссылки на странице (списки, фильтры, ответы чата) сразу получают настоящие адреса
new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) localizeLinks(n); })
  .observe(document.body, { childList: true, subtree: true });

// ── События ──
document.addEventListener("click", (e) => {
  const actEl = e.target.closest("[data-act]");
  const act = actEl?.dataset.act;
  if (act === "search") return openSearch();
  if (act === "lang") return toggleLang(actEl);
  if (act === "cmp-open") return openCompare();
  if (act === "cmp-clear") { store.cmp = []; save(); paintCompare(); $$("[data-cmp]").forEach((c) => { c.checked = false; }); return; }
  // смена языка — обычный переход по ссылке (страница загружается заново на новом языке); выбор запоминаем
  const langLink = e.target.closest("a[data-lang]");
  if (langLink) { pref.set(langLink.dataset.lang); return; }
  if (!e.target.closest(".lang")) toggleLang($(".lang-btn"), false);
  if (e.target.closest("[data-close]") || e.target.matches("[data-scrim]")) return closeLayer();

  // внутренние ссылки — без перезагрузки страницы
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== "_self") return;
  if (a.hasAttribute("download")) return;
  const raw = a.getAttribute("href");
  if (raw.startsWith("#") && !raw.startsWith("#/")) return; // якорь внутри страницы
  const url = new URL(raw.startsWith("#/") ? href(raw) : raw, location.href);
  if (url.origin !== location.origin || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return; // чужой сайт или файл
  e.preventDefault();
  if (e.target.closest(".res")) closeLayer();
  navigate(url.pathname + url.search);
});
window.addEventListener("popstate", route);
document.addEventListener("keydown", (e) => {
  const layer = $("#layer");
  if (e.key === "Escape") { closeLayer(); toggleLang($(".lang-btn"), false); }
  // фокус не уходит из открытого окна
  if (e.key === "Tab" && layer.innerHTML) {
    const f = $$("a[href], button:not([disabled]), input, select", layer);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!layer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
});
// «К содержанию» переносит фокус, а не меняет адрес
$(".skip").addEventListener("click", (e) => { e.preventDefault(); $("#main").focus(); });

route().catch((err) => {
  console.error(err);
  $("#main").innerHTML = `<div class="wrap page"><div class="empty"><b>Не удалось загрузить данные</b><span class="muted small">Проверьте интернет и обновите страницу.</span><button class="btn btn-primary" onclick="location.reload()">Обновить</button></div></div>`;
});
