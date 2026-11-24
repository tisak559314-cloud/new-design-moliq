// Каркас: шапка, нижняя панель, маршруты, поиск, вход, сравнение.
import { $, $$, esc, safeUrl, icon, flag, toast, pct, short, term } from "./lib.js";
import { init, db, bankName } from "./data.js";
import { store, save } from "./store.js";
import { setLang, tr } from "./i18n.js";

const NAV = [
  { id: "credits", href: "#/credits", label: "Кредиты", icon: "credit" },
  { id: "deposits", href: "#/deposits", label: "Вклады", icon: "deposit" },
  { id: "cards", href: "#/cards", label: "Карты", icon: "card" },
  { id: "transfers", href: "#/transfers", label: "Переводы", icon: "send" },
  { id: "rates", href: "#/rates", label: "Курсы валют", tab: "Курсы", icon: "fx" },
  { id: "map", href: "#/map", label: "Банкоматы", tab: "Карта", icon: "pin" },
  { id: "check", href: "#/check", label: "Что мне по силам", icon: "gauge" },
];
const TABS = [{ id: "", href: "#/", label: "Главная", icon: "home" }, ...NAV.filter((n) => ["credits", "deposits", "rates", "map"].includes(n.id))];
const LANGS = [{ id: "ru", code: "RU", name: "Русский" }, { id: "uz", code: "UZ", name: "Oʻzbekcha" }, { id: "en", code: "EN", name: "English" }];

const VIEWS = {
  "": () => import("./views/home.js"),
  credits: () => import("./views/catalog.js"),
  deposits: () => import("./views/catalog.js"),
  cards: () => import("./views/catalog.js"),
  transfers: () => import("./views/transfers.js"),
  rates: () => import("./views/rates.js"),
  check: () => import("./views/check.js"),
  map: () => import("./views/map.js"),
  chat: () => import("./views/chat.js"),
  banks: () => import("./views/banks.js"),
  bank: () => import("./views/banks.js"),
};
const TITLES = { "": "Moliq — кредиты, вклады, карты и курсы банков Узбекистана", credits: "Кредиты", deposits: "Вклады", cards: "Карты", transfers: "Переводы без комиссии", rates: "Курсы валют", check: "Что мне по силам", map: "Банкоматы на карте", chat: "AI-чат", banks: "Банки", bank: "Банк" };

export const bankLogo = (id, cls = "") => {
  const b = db.bank[id];
  return `<span class="logo-b ${cls}">${b?.icon ? `<img src="assets/banks/${esc(b.icon)}" alt="" loading="lazy">` : `<span class="ini" style="background:${esc(b?.color || "#697180")}">${esc(b?.short || "?")}</span>`}</span>`;
};
export const dateRu = (iso) => { const [y, m, d] = String(iso || "").split("-"); return d ? `${d}.${m}.${y}` : ""; };
export const rateRange = (l) => (l.rateLo == null ? "—" : l.rateLo === l.rateHi ? pct(l.rateLo) : `${pct(l.rateLo).replace("%", "")}–${pct(l.rateHi)}`);

// ── Шапка и панели ──
function paintChrome(section) {
  const lang = LANGS.find((l) => l.id === store.lang) || LANGS[0];
  $("#top").innerHTML = `<div class="wrap top-in">
    <a class="brand" href="#/" aria-label="Moliq — на главную"><img src="assets/moliq-logo.svg" alt="" width="34" height="28">Moliq</a>
    <nav class="nav" aria-label="Разделы">${NAV.map((n) => `<a href="${n.href}"${n.id === section ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
    <div class="top-r">
      <button class="icon-btn" data-act="search" aria-label="Поиск">${icon("search")}</button>
      <div class="lang">
        <button class="lang-btn" data-act="lang" aria-haspopup="menu" aria-expanded="false" aria-label="Язык: ${lang.name}">${flag(lang.id)}<span class="code">${lang.code}</span></button>
      </div>
      <button class="icon-btn login-ic" data-act="login" aria-label="Войти">${icon("user")}</button>
      <button class="btn btn-soft btn-sm btn-login" data-act="login">Войти</button>
    </div>
  </div>`;
  $("#tabbar").innerHTML = TABS.map((n) => `<a href="${n.href}"${n.id === section ? ' aria-current="page"' : ""}><i>${icon(n.icon)}</i>${n.tab || n.label}</a>`).join("");
  $("#fab").innerHTML = section === "chat" ? "" : `<a class="fab" href="#/chat" aria-label="AI-чат"><i>${icon("chat", "ic-l")}</i><span>AI-чат</span></a>`;
  $("#foot").innerHTML = `<div class="wrap foot-in">
    <p>Условия банков и курсы — с Bank.uz, официальный курс — ЦБ. Данные на ${esc(dateRu(db.date))}. Решение о выдаче принимает банк.</p>
    <div class="foot-links"><a href="#/banks">Банки</a><a href="#/check">Что мне по силам</a><a href="#/chat">AI-чат</a><a href="${safeUrl(db.source?.url)}" target="_blank" rel="noopener">Источник данных</a></div>
  </div>`;
  document.body.classList.toggle("no-foot", section === "map" || section === "chat");
  document.body.classList.toggle("no-tab", section === "chat");
}

// ── Маршруты ──
let cleanup = null, lastSection = null, turn = 0;
async function route() {
  const my = ++turn;
  const raw = location.hash.replace(/^#\/?/, "");
  const [pathStr, queryStr = ""] = raw.split("?");
  const path = pathStr.split("/").filter(Boolean).map(decodeURIComponent);
  const section = Object.hasOwn(VIEWS, path[0] || "") ? path[0] || "" : "";
  const main = $("#main");
  closeLayer();
  await init();
  const mod = await VIEWS[section]();
  if (my !== turn) return; // пока грузили, человек ушёл дальше
  if (cleanup) { try { cleanup(); } catch { /* вид уже снят */ } cleanup = null; }
  paintChrome(section);
  document.title = section ? `${tr(TITLES[section])} — Moliq` : tr(TITLES[""]);
  // каждый вид получает свой узел: обработчики прошлой страницы уходят вместе с ним
  const host = document.createElement("div");
  host.className = "view";
  main.replaceChildren(host);
  const off = (await mod.default(host, { section, path, query: new URLSearchParams(queryStr) })) || null;
  if (my !== turn) { try { off?.(); } catch { /* вид уже снят */ } return; }
  cleanup = off;
  if (section !== lastSection) window.scrollTo(0, 0);
  lastSection = section;
  paintCompare();
}

// ── Окна ──
const layer = () => $("#layer");
let lastFocus = null;
function openLayer(html, cls = "") {
  lastFocus = document.activeElement;
  layer().innerHTML = `<div class="scrim ${cls}" data-scrim>${html}</div>`;
  document.body.style.overflow = "hidden";
  // окно без поля ввода получает фокус на первую кнопку
  queueMicrotask(() => { if (!layer().contains(document.activeElement)) $("input, button, a[href]", layer())?.focus(); });
}
export function closeLayer() {
  if (!layer().innerHTML) return;
  layer().innerHTML = "";
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

function openSearch() {
  openLayer(`<div class="sheet" role="dialog" aria-modal="true" aria-label="Поиск">
    <div class="sheet-head">${icon("search")}<input id="q" type="search" placeholder="Банк, кредит, вклад или карта" autocomplete="off" aria-label="Поиск"><button class="icon-btn" data-close aria-label="Закрыть">${icon("x")}</button></div>
    <div class="sheet-body" id="q-res"></div>
  </div>`, "top-sheet");
  const q = $("#q"), box = $("#q-res");
  const paint = () => { box.innerHTML = searchResults(q.value); };
  q.addEventListener("input", paint);
  q.addEventListener("keydown", (e) => {
    const items = $$(".res", box);
    if (!items.length) return;
    let i = items.findIndex((x) => x.classList.contains("cur"));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[i]?.classList.remove("cur");
      i = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[i].classList.add("cur");
      items[i].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") { (items[i] || items[0]).click(); }
  });
  paint();
  q.focus();
}
function searchResults(text) {
  const t = text.trim().toLowerCase();
  if (!t) {
    return `<div class="res-g">Часто ищут</div>${[["#/credits/micro", "Микрозаймы"], ["#/deposits", "Вклады в сумах"], ["#/rates/USD", "Курс доллара"], ["#/map", "Банкоматы рядом"]].map(([h, l]) => `<a class="res" href="${h}"><b>${l}</b></a>`).join("")}`;
  }
  const has = (s) => String(s || "").toLowerCase().includes(t);
  const banks = db.banks.filter((b) => has(b.name) || has(b.id)).slice(0, 4);
  const loans = db.loans.filter((l) => has(l.name) || has(bankName(l.bankId))).slice(0, 5);
  const deps = db.deposits.filter((d) => has(d.name) || has(bankName(d.bankId))).slice(0, 5);
  const cards = db.cards.filter((c) => has(c.name) || has(bankName(c.bankId))).slice(0, 5);
  const row = (href, id, title, sub, right) => `<a class="res" href="${href}">${bankLogo(id, "sm")}<div><b>${esc(title)}</b><span>${esc(sub)}</span></div>${right ? `<span class="r num">${esc(right)}</span>` : ""}</a>`;
  const g = (title, rows) => (rows.length ? `<div class="res-g">${title}</div>${rows.join("")}` : "");
  const out = g("Банки", banks.map((b) => row(`#/bank/${b.id}`, b.id, b.name, "Все продукты банка")))
    + g("Кредиты", loans.map((l) => row(`#/credits/${l.type}?open=${l.id}`, l.bankId, l.name, bankName(l.bankId), l.rateLo != null ? rateRange(l) : "")))
    + g("Вклады", deps.map((d) => row(`#/deposits?cur=${d.cur}&open=${d.id}`, d.bankId, d.name, bankName(d.bankId), d.rate != null ? pct(d.rate) : "")))
    + g("Карты", cards.map((c) => row(`#/cards?open=${c.id}`, c.bankId, c.name, bankName(c.bankId), c.systems.join(", "))));
  return out || `<div class="empty"><b>Ничего не нашли</b><span class="muted small">Попробуйте название банка или продукта</span></div>`;
}

function openLogin() {
  openLayer(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lg-t" style="max-width:420px">
    <div class="sheet-head"><h2 id="lg-t">Вход</h2><button class="icon-btn" data-close aria-label="Закрыть">${icon("x")}</button></div>
    <form class="sheet-pad" id="lg">
      <label class="field"><span>Номер телефона</span><input type="tel" inputmode="tel" placeholder="+998 90 123 45 67" autocomplete="tel" required></label>
      <button class="btn btn-primary btn-block">Получить код</button>
      <p class="cap">Код придёт в SMS. В профиле хранятся ваши расчёты и сравнения.</p>
    </form>
  </div>`);
  $("#lg input").focus();
  $("#lg").addEventListener("submit", (e) => { e.preventDefault(); closeLayer(); toast("Это макет: вход подключится при переносе на сайт"); });
}

function toggleLang(btn) {
  const wrap = btn.parentElement, open = $(".menu", wrap);
  if (open) { open.remove(); btn.setAttribute("aria-expanded", "false"); return; }
  btn.setAttribute("aria-expanded", "true");
  wrap.insertAdjacentHTML("beforeend", `<div class="menu" role="menu">${LANGS.map((l) => `<button role="menuitemradio" aria-checked="${l.id === store.lang}" data-lang="${l.id}">${flag(l.id)}${l.name}${l.id === store.lang ? icon("check", "ic-s") : ""}</button>`).join("")}</div>`);
}

// ── Сравнение ──
const CMP_MAX = 3;
export function toggleCompare(kind, id) {
  const i = store.cmp.findIndex((x) => x.kind === kind && x.id === id);
  if (i >= 0) store.cmp.splice(i, 1);
  else {
    if (store.cmp.length && store.cmp[0].kind !== kind) store.cmp = [];
    if (store.cmp.length >= CMP_MAX) { toast(`Сравнить можно до ${CMP_MAX} предложений`); return false; }
    store.cmp.push({ kind, id });
  }
  save(); paintCompare();
  return true;
}
export const inCompare = (kind, id) => store.cmp.some((x) => x.kind === kind && x.id === id);
function paintCompare() {
  $(".cmp-bar")?.remove();
  if (!store.cmp.length) return;
  const n = store.cmp.length;
  document.body.insertAdjacentHTML("beforeend", `<div class="cmp-bar" role="region" aria-label="Сравнение">В сравнении: ${n}
    <button class="btn btn-lime btn-sm" data-act="cmp-open"${n < 2 ? " disabled" : ""}>${n < 2 ? "Добавьте ещё" : "Сравнить"}</button>
    <button class="icon-btn" data-act="cmp-clear" aria-label="Очистить сравнение">${icon("x")}</button></div>`);
}
function openCompare() {
  const kind = store.cmp[0].kind;
  const list = { loan: db.loans, deposit: db.deposits, card: db.cards }[kind];
  const items = store.cmp.map((c) => list.find((x) => x.id === c.id)).filter(Boolean);
  const yes = (v) => (v ? "Да" : "Нет");
  const rows = {
    loan: [
      ["Ставка", (l) => rateRange(l), (l) => l.rateHi, "min"],
      ["Сумма", (l) => (l.max ? `до ${short(l.max)}` : "—"), (l) => l.max, "max"],
      ["Срок", (l) => (l.termHi ? `до ${term(l.termHi)}` : "—"), (l) => l.termHi, "max"],
      ["Обеспечение", (l) => l.collateralType || "—"],
      ["Оформление", (l) => l.channel || "—"],
      ["Погашение", (l) => l.repay || "—"],
    ],
    deposit: [
      ["Ставка", (d) => (d.rate != null ? pct(d.rate) : "—"), (d) => d.rate, "max"],
      ["Срок", (d) => (d.termHi ? term(d.termHi) : "—")],
      ["Минимальная сумма", (d) => (d.min ? short(d.min) : "—"), (d) => d.min, "min"],
      ["Пополнение", (d) => yes(d.topup)],
      ["Снятие", (d) => yes(d.withdraw)],
      ["Капитализация", (d) => yes(d.capitalization)],
    ],
    card: [
      ["Платёжная система", (c) => c.systems.join(", ")],
      ["Валюта", (c) => c.cur],
      ["Выпуск", (c) => c.issueText || "—", (c) => c.issue, "min"],
      ["Обслуживание в год", (c) => c.yearlyText || "—"],
      ["Срок действия", (c) => (c.validityYears ? `${c.validityYears} ${c.validityYears > 4 ? "лет" : "года"}` : "—")],
    ],
  }[kind];
  const body = rows.map(([label, show, val, dir]) => {
    let best = null;
    if (val) { const vs = items.map(val).filter((v) => v != null); if (vs.length > 1 && new Set(vs).size > 1) best = dir === "min" ? Math.min(...vs) : Math.max(...vs); }
    return `<div class="cmp-row"><div>${label}</div>${items.map((it) => `<div class="${val && best != null && val(it) === best ? "win" : ""}">${esc(show(it))}</div>`).join("")}</div>`;
  }).join("");
  openLayer(`<div class="sheet sheet-wide" role="dialog" aria-modal="true" aria-labelledby="cmp-t">
    <div class="sheet-head"><h2 id="cmp-t">Сравнение</h2><button class="icon-btn" data-close aria-label="Закрыть">${icon("x")}</button></div>
    <div class="sheet-body"><div class="cmp" style="--n:${items.length}">
      <div class="cmp-row"><div></div>${items.map((it) => `<div class="best-head">${bankLogo(it.bankId, "sm")}<div><b>${esc(it.name)}</b><span>${esc(bankName(it.bankId))}</span></div></div>`).join("")}</div>
      ${body}
    </div></div>
  </div>`);
}

// ── События ──
document.addEventListener("click", (e) => {
  const actEl = e.target.closest("[data-act]");
  const act = actEl?.dataset.act;
  if (act === "search") return openSearch();
  if (act === "login") return openLogin();
  if (act === "lang") return toggleLang(actEl);
  if (act === "cmp-open") return openCompare();
  if (act === "cmp-clear") { store.cmp = []; save(); paintCompare(); $$("[data-cmp]").forEach((c) => { c.checked = false; }); return; }
  const lang = e.target.closest("[data-lang]")?.dataset.lang;
  if (lang) { store.lang = lang; save(); setLang(lang); route(); return; }
  if (!e.target.closest(".lang")) { $(".lang .menu")?.remove(); $(".lang-btn")?.setAttribute("aria-expanded", "false"); }
  if (e.target.closest("[data-close]") || e.target.matches("[data-scrim]")) return closeLayer();
  if (e.target.closest(".res")) closeLayer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeLayer(); $(".lang .menu")?.remove(); $(".lang-btn")?.setAttribute("aria-expanded", "false"); }
  // фокус не уходит из открытого окна
  if (e.key === "Tab" && layer().innerHTML) {
    const f = $$("a[href], button:not([disabled]), input, select", layer());
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!layer().contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
});
window.addEventListener("hashchange", route);
// «К содержанию» переносит фокус, а не меняет адрес (иначе маршрут уводил бы на главную)
$(".skip").addEventListener("click", (e) => { e.preventDefault(); $("#main").focus(); });
setLang(store.lang);
route().catch((err) => {
  console.error(err);
  $("#main").innerHTML = `<div class="wrap page"><div class="empty"><b>Не удалось загрузить данные</b><span class="muted small">Обновите страницу. Сайт должен быть открыт через локальный сервер, а не как файл.</span><button class="btn btn-primary" onclick="location.reload()">Обновить</button></div></div>`;
});
