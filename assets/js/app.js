// Интерфейс сайта: шапка, нижняя панель, подвал, окна, поиск, сравнение, общие помощники страниц.
// Модуль без побочных эффектов: его подключают страницы, main.js (запуск в браузере) и сборка (отрисовка страниц
// заранее, tools/build.mjs). Маршруты и обработчики событий — в main.js.
import { $, $$, esc, safeUrl, icon, flag, toast, pct, short, term, fmt2 } from "./lib.js";
import { db, bankName, stocks as loadStocks } from "./data.js";
import { store, save } from "./store.js";
import { href, lang } from "./nav.js";
import { stockLogo } from "./stock-logo.js";

// «Карты» в меню нет (решение Азама 2026-11-25): раздел открывается с главной и из поиска; «Банки» — первым
export const NAV = [
  { id: "banks", label: "Банки", icon: "bank" },
  { id: "credits", label: "Кредиты", icon: "credit" },
  { id: "deposits", label: "Вклады", icon: "deposit" },
  { id: "transfers", label: "Переводы", icon: "send" },
  { id: "rates", label: "Курсы валют", tab: "Курсы", icon: "fx" },
  { id: "stocks", label: "Акции", icon: "stock" },
  { id: "map", label: "Банкоматы", tab: "Карта", icon: "pin" },
  { id: "check", label: "Что мне по силам", icon: "gauge" },
];
const TABS = [{ id: "", label: "Главная", icon: "home" }, ...NAV.filter((n) => ["credits", "deposits", "rates", "map"].includes(n.id))];
export const LANG_NAMES = [{ id: "ru", code: "RU", name: "Русский" }, { id: "uz", code: "UZ", name: "Oʻzbekcha" }, { id: "en", code: "EN", name: "English" }];

/** Разделы сайта → модуль страницы */
export const VIEWS = {
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
  stocks: () => import("./views/stocks.js"),
};
export const TITLES = { "": "Moliq — кредиты, вклады, карты и курсы банков Узбекистана", credits: "Кредиты", deposits: "Вклады", cards: "Карты", transfers: "Переводы без комиссии", rates: "Курсы валют", check: "Что мне по силам", map: "Банкоматы на карте", chat: "AI-чат", banks: "Банки", bank: "Банк", stocks: "Акции Узбекистана" };

export const bankLogo = (id, cls = "") => {
  const b = db.bank[id];
  return `<span class="logo-b ${cls}">${b?.icon ? `<img src="/assets/banks/${esc(b.icon)}" alt="" loading="lazy">` : `<span class="ini" style="background:${esc(b?.color || "#697180")}">${esc(b?.short || "?")}</span>`}</span>`;
};
export const dateRu = (iso) => { const [y, m, d] = String(iso || "").split("-"); return d ? `${d}.${m}.${y}` : ""; };
export const rateRange = (l) => (l.rateLo == null ? "—" : l.rateLo === l.rateHi ? pct(l.rateLo) : `${pct(l.rateLo).replace("%", "")}–${pct(l.rateHi)}`);

// ── Шапка и панели ──
/** here — путь текущей страницы без языка («/credits/micro?…»): меню языка ведёт на эту же страницу */
export function paintChrome(section, here = "/") {
  const cur = LANG_NAMES.find((l) => l.id === lang()) || LANG_NAMES[0];
  $("#top").innerHTML = `<div class="wrap top-in">
    <a class="brand" href="#/" aria-label="Moliq — на главную"><img src="/assets/moliq-logo.svg" alt="" width="34" height="28">Moliq</a>
    <nav class="nav" aria-label="Разделы">${NAV.map((n) => `<a href="#/${n.id}"${n.id === section || (n.id === "banks" && section === "bank") ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
    <div class="top-r">
      <button class="icon-btn" data-act="search" aria-label="Поиск">${icon("search")}</button>
      <div class="lang">
        <button class="lang-btn" data-act="lang" aria-haspopup="menu" aria-expanded="false" aria-label="Язык: ${cur.name}">${flag(cur.id)}<span class="code">${cur.code}</span></button>
        <div class="menu" role="menu" hidden>${LANG_NAMES.map((l) => `<a role="menuitemradio" aria-checked="${l.id === cur.id}" href="${esc(href(here, l.id))}" hreflang="${l.id}" lang="${l.id}" data-lang="${l.id}">${flag(l.id)}${l.name}${l.id === cur.id ? icon("check", "ic-s") : ""}</a>`).join("")}</div>
      </div>
    </div>
  </div>`;
  $("#tabbar").innerHTML = TABS.map((n) => `<a href="#/${n.id}"${n.id === section ? ' aria-current="page"' : ""}><i>${icon(n.icon)}</i>${n.tab || n.label}</a>`).join("");
  $("#fab").innerHTML = section === "chat" ? "" : `<a class="fab" href="#/chat" aria-label="AI-чат"><i>${icon("chat", "ic-l")}</i><span>AI-чат</span></a>`;
  $("#foot").innerHTML = `<div class="wrap foot-in">
    <p>Условия банков и курсы — с Bank.uz, официальный курс — ЦБ. Данные на ${esc(dateRu(db.date))}. Решение о выдаче принимает банк.</p>
    <div class="foot-links"><a href="#/banks">Банки</a><a href="#/check">Что мне по силам</a><a href="#/chat">AI-чат</a><a href="${safeUrl(db.source?.url)}" target="_blank" rel="noopener">Источник данных</a></div>
  </div>`;
  document.body.classList.toggle("no-foot", section === "map" || section === "chat");
  document.body.classList.toggle("no-tab", section === "chat");
}

/** Меню языка: show — открыть (true), закрыть (false) или переключить (по умолчанию) */
export function toggleLang(btn, show) {
  const menu = btn && $(".menu", btn.parentElement);
  if (!menu) return;
  const open = typeof show === "boolean" ? show : menu.hidden;
  menu.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
}

// ── Окна ──
const layer = () => $("#layer");
let lastFocus = null;
export function openLayer(html, cls = "") {
  lastFocus = document.activeElement;
  layer().innerHTML = `<div class="scrim ${cls}" data-scrim>${html}</div>`;
  document.body.style.overflow = "hidden";
  // окно без поля ввода получает фокус на первую кнопку
  queueMicrotask(() => { if (!layer().contains(document.activeElement)) $("input, button, a[href]", layer())?.focus(); });
}
export function closeLayer() {
  if (!layer()?.innerHTML) return;
  layer().innerHTML = "";
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

// ── Поиск ──
// Названия банков и продуктов — по-русски, а ищут и латиницей, и с разными апострофами (oʻ, o', o).
// Поэтому строку и запрос приводим к одному виду: латиница без апострофов, «х» и «h» не различаются.
const CYR = { а: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", ў: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ҳ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya" };
export const searchKey = (s) => String(s || "").toLowerCase()
  .replace(/[а-яёғқўҳ]/g, (c) => CYR[c] ?? c)
  .replace(/[ʻʼ'’‘`´]/g, "").replace(/x/g, "h").replace(/[^a-z0-9]+/g, " ").trim();

export function openSearch() {
  openLayer(`<div class="sheet" role="dialog" aria-modal="true" aria-label="Поиск">
    <div class="sheet-head">${icon("search")}<input id="q" type="search" placeholder="Банк, кредит, вклад или карта" autocomplete="off" aria-label="Поиск"><button class="icon-btn" data-close aria-label="Закрыть">${icon("x")}</button></div>
    <div class="sheet-body" id="q-res"></div>
  </div>`, "top-sheet");
  const q = $("#q"), box = $("#q-res");
  const paint = () => { box.innerHTML = searchResults(q.value); };
  q.addEventListener("input", paint);
  // акции — отдельный файл: подгружаем при открытии поиска и дорисовываем результаты, когда пришёл
  if (!stockList) loadStocks().then((d) => { stockList = d.stocks.filter((s) => s.status !== "gone"); if (layer().contains(q)) paint(); }).catch(() => {});
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
let stockList = null;
export function searchResults(text) {
  const t = searchKey(text);
  if (!t) {
    return `<div class="res-g">Часто ищут</div>${[["#/credits/micro", "Микрозаймы"], ["#/deposits", "Вклады в сумах"], ["#/rates/USD", "Курс доллара"], ["#/rates/gold", "Золотые слитки"], ["#/stocks", "Акции Узбекистана"], ["#/transfers", "Переводы без комиссии"], ["#/map", "Банкоматы рядом"]].map(([h, l]) => `<a class="res" href="${h}"><b>${l}</b></a>`).join("")}`;
  }
  const has = (...xs) => xs.some((s) => searchKey(s).includes(t));
  const banks = db.banks.filter((b) => has(b.name, b.id)).slice(0, 4);
  const loans = db.loans.filter((l) => has(l.name, bankName(l.bankId))).slice(0, 5);
  const deps = db.deposits.filter((d) => has(d.name, bankName(d.bankId))).slice(0, 5);
  const cards = db.cards.filter((c) => has(c.name, bankName(c.bankId))).slice(0, 5);
  const row = (to, id, title, sub, right) => `<a class="res" href="${to}">${bankLogo(id, "sm")}<div><b>${esc(title)}</b><span>${esc(sub)}</span></div>${right ? `<span class="r num">${esc(right)}</span>` : ""}</a>`;
  const g = (title, rows) => (rows.length ? `<div class="res-g">${title}</div>${rows.join("")}` : "");
  // тикер ищем и с начала («uzm» → UZMT), и в названии компании
  const stocks = (stockList ?? []).filter((s) => s.t.toLowerCase().startsWith(t.replace(/\s/g, "")) || searchKey(`${s.name} ${s.full || ""} ${s.code}`).includes(t)).slice(0, 4);
  const stockRow = (s) => `<a class="res" href="#/stocks/${esc(s.t)}">${stockLogo(s.t) ? `<span class="stk-ava sm has-logo" aria-hidden="true"><img src="${stockLogo(s.t)}" alt="" loading="lazy"${stockLogo(s.t).startsWith("/assets/stocks/") ? ' class="fit"' : ""}></span>` : `<span class="stk-ava sm s-${esc(s.sector)}" aria-hidden="true">${esc(s.t)}</span>`}<div><b>${esc(s.name)}</b><span>${esc(s.t)} · Акции</span></div>${s.last ? `<span class="r num">${esc(fmt2(s.last.p))} сум</span>` : ""}</a>`;
  const out = g("Банки", banks.map((b) => row(`#/bank/${b.id}`, b.id, b.name, "Все продукты банка")))
    + g("Акции", stocks.map(stockRow))
    + g("Кредиты", loans.map((l) => row(`#/credits/${l.type}?open=${l.id}`, l.bankId, l.name, bankName(l.bankId), l.rateLo != null ? rateRange(l) : "")))
    + g("Вклады", deps.map((d) => row(`#/deposits?cur=${d.cur}&open=${d.id}`, d.bankId, d.name, bankName(d.bankId), d.rate != null ? pct(d.rate) : "")))
    + g("Карты", cards.map((c) => row(`#/cards?open=${c.id}`, c.bankId, c.name, bankName(c.bankId), c.systems.join(", "))));
  return out || `<div class="empty"><b>Ничего не нашли</b><span class="muted small">Попробуйте название банка или продукта</span></div>`;
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
export function paintCompare() {
  $(".cmp-bar")?.remove();
  if (!store.cmp.length) return;
  const n = store.cmp.length;
  document.body.insertAdjacentHTML("beforeend", `<div class="cmp-bar" role="region" aria-label="Сравнение">В сравнении: ${n}
    <button class="btn btn-lime btn-sm" data-act="cmp-open"${n < 2 ? " disabled" : ""}>${n < 2 ? "Добавьте ещё" : "Сравнить"}</button>
    <button class="icon-btn" data-act="cmp-clear" aria-label="Очистить сравнение">${icon("x")}</button></div>`);
}
export function openCompare() {
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
