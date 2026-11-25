// Акции Узбекистана: бумаги биржи «Тошкент» и все акционерные общества страны; страница бумаги с графиком.
// Данные — stocks.json и stocks/<ТИКЕР>.json (moliq/bankmap-next/scripts/import-stocks.mjs): цены сделок — с биржи,
// список АО — из Центрального депозитария. Это справка, а не совет: порядок — по активности торгов, оценок «хорошая /
// плохая» нет, цена всегда с датой сделки, дни без сделок график не рисует как торговые.
import { $, $$, esc, icon, fmt, fmt2, short, plural } from "../lib.js";
import { stocks as loadStocks, stockHistory } from "../data.js";
import { openLayer, searchKey, dateRu } from "../app.js";
import { href, lang } from "../nav.js";
import { tr } from "../i18n.js";
import { stockLogo } from "../stock-logo.js";

export const SECTORS = [["bank", "Банки"], ["industry", "Промышленность"], ["insurance", "Страхование"], ["oilgas", "Нефть и газ"], ["telecom", "Телеком"], ["transport", "Транспорт"], ["other", "Прочие"]];
const SECTOR = Object.fromEntries(SECTORS);
const CAT = { premium: "Premium", standard: "Standard", privatization: "Приватизация", transit: "Транзит" };
const LIQ = { high: "Высокая", mid: "Средняя", low: "Низкая" };
const KIND = { c: "Обыкновенная", p: "Привилегированная" };
const PERIODS = [["7", "1Н"], ["30", "1М"], ["91", "3М"], ["182", "6М"], ["365", "1Г"], ["1095", "3Г"], ["all", "Всё"]];
const PAGE = 30;
/** Пропуск больше недели — уже не выходные и не праздник: линию не тянем */
const GAP_DAYS = 7;
const FAV_KEY = "moliq-stocks";
const LIST_KEY = "moliq-stocks-q";
const UZSE = "https://uzse.uz";

// ── Время и числа ──
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent" }).format(new Date());
const dayMs = (iso) => Date.parse(`${iso}T00:00:00Z`);
const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / 86_400_000);
const addDays = (iso, n) => new Date(dayMs(iso) + n * 86_400_000).toISOString().slice(0, 10);
/** «25.11» в этом году, «18.07.2025» — в прошлом */
const dShort = (iso) => (iso.slice(0, 4) === today().slice(0, 4) ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}` : dateRu(iso));
const pct1 = (x) => `${String(Math.round(x * 10) / 10).replace(".", ",")}%`;
const price = (p) => `${fmt2(p)} сум`;
const money = (v) => `${short(v)} сум`;
const ago = (n) => `${n} ${plural(n, ["день", "дня", "дней"])}`;

// ── Избранное: живёт между заходами, только в этом браузере ──
const fav = {
  list() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } },
  has(t) { return this.list().includes(t); },
  toggle(t) {
    const l = this.list(), i = l.indexOf(t);
    if (i >= 0) l.splice(i, 1); else l.push(t);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch { /* приватный режим */ }
    return i < 0;
  },
};
const favBtn = (t) => { const on = fav.has(t); return `<button class="icon-btn stk-fav" data-fav="${esc(t)}" aria-pressed="${on}" aria-label="${on ? "Убрать из моих акций" : "В мои акции"}">${icon("star")}</button>`; };

// ── Что известно о цене ──
/** Изменение к прошлой цене: { d, pct } или null */
function dayChange(s) {
  if (!s.last || !(s.prev > 0)) return null;
  const d = s.last.p - s.prev;
  return { d, pct: (d / s.prev) * 100 };
}
function monthChange(s) {
  if (!s.last || !(s.base30?.p > 0)) return null;
  const d = s.last.p - s.base30.p;
  return { d, pct: (d / s.base30.p) * 100, since: s.base30.d };
}
const chgHtml = (c, abs = false) => {
  if (!c) return "";
  if (Math.abs(c.pct) < 0.05) return `<span class="chg">0%</span>`;
  return `<span class="chg ${c.d > 0 ? "up" : "down"} num">${c.d > 0 ? "▲" : "▼"} ${abs ? `${fmt2(Math.abs(c.d))} · ` : ""}${pct1(Math.abs(c.pct))}</span>`;
};
/** Свежесть цены: ok — сделка за неделю, old — до месяца, stale — дольше, none — сделок в наших данных нет */
function freshness(s) {
  if (!s.last) return { k: "none" };
  const n = daysBetween(s.last.d, today());
  return { k: n <= 7 ? "ok" : n <= 30 ? "old" : "stale", n };
}
/** Группа для порядка «сначала активные»: свежая цена → давняя → нет цены → торги прекращены */
const activeGroup = (s) => (s.status === "gone" ? 4 : { ok: 0, old: 1, stale: 2, none: 3 }[freshness(s).k]);

const initials = (n) => String(n || "?").replace(/[^A-Za-zА-Яа-яЁё0-9 ]/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
/** Аватар бумаги: логотип компании, если он есть, иначе тикер в квадрате цвета отрасли. logoT — тикер для логотипа */
const ava = (s, cls = "", logoT = s.t) => {
  const logo = stockLogo(logoT);
  return logo ? `<span class="stk-ava has-logo ${cls}" aria-hidden="true"><img src="${logo}" alt="" loading="lazy"${logo.startsWith("/assets/stocks/") ? ' class="fit"' : ""}></span>`
    : `<span class="stk-ava s-${esc(s.sector || s.s || "other")} ${cls}" aria-hidden="true">${esc(s.t || initials(s.n))}</span>`;
};
const subline = (s) => [KIND[s.kind], s.status === "listed" ? CAT[s.cat] : s.status === "otc" ? "Вне котировального листа" : "Торги прекращены"].filter(Boolean).join(" · ");

export default async function stocksView(root, { path, query }) {
  let data;
  try { data = await loadStocks(); } catch {
    root.innerHTML = `<div class="wrap page"><div class="page-head"><h1>Акции Узбекистана</h1></div><div class="empty"><b>Данные об акциях не загрузились</b><span class="muted small">Обновите страницу</span></div></div>`;
    return;
  }
  return path[1] ? stockPage(root, data, decodeURIComponent(path[1]).toUpperCase()) : catalog(root, data, query);
}

// ════════════════════════════════ Каталог ════════════════════════════════

function catalog(root, data, query) {
  const all = data.stocks, issuers = data.issuers;
  const session = data.session;
  const f = {
    view: query.get("view") === "all" ? "all" : "market",
    q: query.get("q") || "",
    sector: SECTOR[query.get("sector")] ? query.get("sector") : "",
    kind: ["c", "p"].includes(query.get("kind")) ? query.get("kind") : "",
    liq: LIQ[query.get("liq")] ? query.get("liq") : "",
    deal: ["session", "week"].includes(query.get("deal")) ? query.get("deal") : "",
    cat: [...Object.keys(CAT), "otc"].includes(query.get("cat")) ? query.get("cat") : "",
    fav: query.get("fav") === "1",
    sort: query.get("sort") || "active",
    region: query.get("region") || "",
  };
  let shown = PAGE, moreOpen = !!(f.kind || f.liq || f.deal || f.cat);
  const regions = [...new Set(issuers.map((i) => i.r).filter(Boolean))].sort((a, b) => (a === "город Ташкент" ? -1 : b === "город Ташкент" ? 1 : a.localeCompare(b, "ru")));
  const sessionLabel = !session || session === today() ? "Сделки сегодня" : `Сделки ${dShort(session)}`;

  // изменение за день имеет смысл только у бумаг с ценой последней сессии; остальные — в конце списка
  function sortChange(a, b, fn, dir) {
    const ok = (s) => (fn === dayChange ? s.last?.d === session : true);
    const v1 = ok(a) ? fn(a)?.pct : null, v2 = ok(b) ? fn(b)?.pct : null;
    return v1 == null ? (v2 == null ? 0 : 1) : v2 == null ? -1 : (v1 - v2) * dir;
  }
  const SORTS = {
    active: ["Сначала активные", (a, b) => activeGroup(a) - activeGroup(b) || (b.liq?.score ?? -1) - (a.liq?.score ?? -1) || (b.m30?.v ?? 0) - (a.m30?.v ?? 0) || (b.last?.d ?? "").localeCompare(a.last?.d ?? "") || a.t.localeCompare(b.t)],
    turnover: ["Больше оборот за 30 дней", (a, b) => (b.m30?.v ?? -1) - (a.m30?.v ?? -1)],
    trades: ["Больше сделок за месяц", (a, b) => (b.liq?.trades ?? -1) - (a.liq?.trades ?? -1)],
    up: ["Сильнее выросли за день", (a, b) => sortChange(a, b, dayChange, -1)],
    down: ["Сильнее упали за день", (a, b) => sortChange(a, b, dayChange, 1)],
    month: ["Изменение за месяц", (a, b) => sortChange(a, b, monthChange, -1)],
    recent: ["Недавние сделки", (a, b) => (b.last?.d ?? "").localeCompare(a.last?.d ?? "") || (b.last?.tm ?? "").localeCompare(a.last?.tm ?? "")],
    name: ["По алфавиту", (a, b) => a.name.localeCompare(b.name, "ru")],
  };
  if (!SORTS[f.sort]) f.sort = "active";

  const matchStock = (s, k) => searchKey(`${s.name} ${s.full || ""} ${s.t} ${s.code} ${s.inn || ""}`).includes(k);
  const matchIssuer = (i, k) => searchKey(`${i.n} ${i.inn} ${i.isin || ""} ${i.pref || ""} ${(i.t || []).join(" ")}`).includes(k);
  function stocksNow() {
    const k = searchKey(f.q), favs = new Set(fav.list());
    return all.filter((s) => {
      if (k && !matchStock(s, k)) return false;
      if (f.fav && !favs.has(s.t)) return false;
      if (f.sector && s.sector !== f.sector) return false;
      if (f.kind && s.kind !== f.kind) return false;
      if (f.liq && s.liq?.lvl !== f.liq) return false;
      if (f.deal === "session" && s.last?.d !== session) return false;
      if (f.deal === "week" && !(s.last && daysBetween(s.last.d, today()) <= 7)) return false;
      if (f.cat === "otc" ? s.status !== "otc" : f.cat && s.cat !== f.cat) return false;
      return true;
    }).sort(SORTS[f.sort][1]);
  }
  function issuersNow() {
    const k = searchKey(f.q);
    return issuers.filter((i) => (!k || matchIssuer(i, k)) && (!f.sector || i.s === f.sector) && (!f.region || i.r === f.region));
  }

  const when = data.fetchedAt ? new Date(data.fetchedAt) : null;
  const stamp = when ? `${new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" }).format(when)}, ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(when)}` : "";
  root.innerHTML = `<div class="wrap page">
    <div class="page-head">
      <h1>Акции Узбекистана</h1>
      <p class="cap stk-lead"><span>Не инвестиционная рекомендация</span>${stamp ? `<span> · </span><span>данные биржи на</span> <span class="num">${esc(stamp)}</span>` : ""}</p>
    </div>
    <div class="ctl stk-ctl">
      <label class="field stk-q">${icon("search")}<span class="sr">Компания, тикер или ISIN</span><input id="sq" type="search" placeholder="Компания, тикер или ISIN" autocomplete="off" enterkeyhint="search" value="${esc(f.q)}"></label>
      <div class="seg" role="group" aria-label="Что показать">
        <button data-view="market" aria-pressed="${f.view === "market"}">На бирже <span class="n num">${all.filter((s) => s.status !== "gone").length}</span></button>
        <button data-view="all" aria-pressed="${f.view === "all"}">Все АО <span class="n num">${issuers.length}</span></button>
      </div>
    </div>
    <div class="bar">
      <div class="chips" id="chips"></div>
      <div class="bar-r"><span class="count num" id="count" aria-live="polite"></span><label class="sort" id="sort-box"></label></div>
    </div>
    <div class="ctl stk-more" id="more-f" hidden></div>
    <div id="list"></div>
    <button class="btn btn-line more-btn" id="more" hidden>Показать ещё</button>
    <p class="cap list-note"><span>Порядок — по активности торгов, это не совет покупать. Цены приходят с задержкой — перед сделкой проверьте их у брокера.</span><br><span>Источники:</span> <a class="link" href="${UZSE}/isu_infos?locale=${lang()}" target="_blank" rel="noopener">биржа «Тошкент»</a>, <a class="link" href="https://uzcsd.uz/issuersList" target="_blank" rel="noopener">Центральный депозитарий</a>.</p>
  </div>`;

  // ── Фильтры ──
  function paintChips() {
    const favN = fav.list().length;
    const chip = (attr, val, label, on) => `<button class="chip" ${attr}="${val}" aria-pressed="${on}">${label}</button>`;
    const any = f.sector || f.fav || f.kind || f.liq || f.deal || f.cat || f.q || f.region;
    $("#chips", root).innerHTML = (f.view === "market" && favN ? chip("data-favonly", "1", `${icon("star", "ic-s")}Мои акции <span class="n num">${favN}</span>`, f.fav) : "")
      + SECTORS.map(([id, name]) => chip("data-sector", id, name, f.sector === id)).join("")
      + (f.view === "market" ? `<button class="chip" data-moref aria-expanded="${moreOpen}">${icon("filter", "ic-s")}Ещё фильтры</button>` : "")
      + (any ? `<button class="chip chip-reset" data-reset>Сбросить</button>` : "");
    const more = $("#more-f", root);
    more.hidden = f.view !== "market" || !moreOpen;
    more.innerHTML = [
      ["Тип акции", "kind", [["c", "Обыкновенные"], ["p", "Привилегированные"]]],
      ["Ликвидность", "liq", Object.entries(LIQ)],
      ["Сделки", "deal", [["session", sessionLabel], ["week", "За 7 дней"]]],
      ["Листинг", "cat", [...Object.entries(CAT), ["otc", "Вне котировального листа"]]],
    ].map(([title, key, opts]) => `<div class="ctl-presets" role="group" aria-label="${title}"><span class="cap">${title}</span>${opts.map(([v, n]) => chip(`data-f-${key}`, v, n, f[key] === v)).join("")}</div>`).join("");
    $("#sort-box", root).innerHTML = f.view === "market"
      ? `<span class="sr">Сортировка</span><select id="sort">${Object.entries(SORTS).map(([id, [name]]) => `<option value="${id}"${f.sort === id ? " selected" : ""}>${name}</option>`).join("")}</select>`
      : `<span class="sr">Область</span><select id="region"><option value="">Все области</option>${regions.map((r) => `<option value="${esc(r)}"${f.region === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select>`;
  }

  // ── Строка бумаги биржи ──
  function stockRow(s) {
    const fr = freshness(s), ch = f.sort === "month" ? monthChange(s) : s.last?.d === session ? dayChange(s) : null;
    const px = s.last
      ? `<div class="v num${fr.k === "stale" ? " dim" : ""}">${price(s.last.p)}</div>${ch ? `<div class="s">${chgHtml(ch)}${f.sort === "month" && ch.since ? ` <span class="cap num">с ${dShort(ch.since)}</span>` : ""}</div>` : ""}`
      : `<div class="v dim">—</div>`;
    const lastCell = !s.last ? `<div class="v dim">Сделок не было</div>`
      : `<div class="v num">${dShort(s.last.d)}${s.last.tm && s.last.d === today() ? `, ${s.last.tm}` : ""}</div>${fr.k === "old" || fr.k === "stale" ? `<span class="tag tag-amber">Без сделок ${ago(fr.n)}</span>` : ""}`;
    return `<div class="stk${s.status === "gone" ? " gone" : ""}">
      <div class="stk-id">${ava(s)}<div><a class="stk-name" href="#/stocks/${esc(s.t)}">${esc(s.name)}</a><div class="stk-sub">${esc(subline(s))}</div></div></div>
      <div class="kv"><div class="k">Цена</div>${px}</div>
      <div class="kv"><div class="k">Последняя сделка</div>${lastCell}</div>
      <div class="kv"><div class="k">Оборот за 30 дней</div><div class="v num${s.m30?.days ? "" : " dim"}">${s.m30?.days ? money(s.m30.v) : "—"}</div></div>
      <div class="kv"><div class="k">Ликвидность</div><div class="v">${s.liq?.lvl ? `<span class="liq ${s.liq.lvl}">${LIQ[s.liq.lvl]}</span>` : `<span class="dim">—</span>`}</div></div>
      <div class="stk-act">${favBtn(s.t)}<button class="btn btn-line btn-sm" data-buy="${esc(s.t)}">Где купить</button></div>
    </div>`;
  }
  // ── Строка акционерного общества ──
  function issuerRow(i) {
    const listed = (i.t || []).map((t) => `<a class="tag tag-blue" href="#/stocks/${esc(t)}">${esc(t)}</a>`).join("");
    return `<div class="stk stk-co">
      <div class="stk-id">${ava({ t: initials(i.n), s: i.s }, "", i.t?.[0])}<div><b class="stk-name">${esc(i.n)}</b><div class="stk-sub">${esc([i.r, SECTOR[i.s]].filter(Boolean).join(" · "))}</div><div class="stk-sub num">ИНН ${esc(i.inn)}${i.isin ? ` · ISIN ${esc(i.isin)}` : ""}</div></div></div>
      <div class="kv"><div class="k">Акций выпущено</div><div class="v num">${i.sh ? short(i.sh) : "—"}</div></div>
      <div class="kv"><div class="k">Номинал</div><div class="v num">${i.nom ? price(i.nom) : "—"}</div></div>
      <div class="kv"><div class="k">Статус</div><div class="v stk-tags">${listed ? `<span class="tag tag-green">Торгуется на бирже</span>${listed}` : `<span class="tag">Выпуск зарегистрирован</span>`}${i.pref ? `<span class="tag">Есть привилегированные</span>` : ""}${i.blocked ? `<span class="tag tag-amber">Заблокирован в депозитарии</span>` : ""}</div></div>
    </div>`;
  }

  function paintList() {
    const list = $("#list", root), more = $("#more", root);
    const market = f.view === "market";
    const rows = market ? stocksNow() : issuersNow();
    $("#count", root).textContent = market ? `${rows.length} ${plural(rows.length, ["бумага", "бумаги", "бумаг"])}` : `${rows.length} ${plural(rows.length, ["компания", "компании", "компаний"])}`;
    if (!rows.length) {
      const k = searchKey(f.q), others = market && k ? issuers.filter((i) => matchIssuer(i, k)).length : 0;
      list.innerHTML = others
        ? `<div class="empty"><b class="h3">На бирже такой бумаги нет</b><span class="muted small">Среди всех акционерных обществ нашлось: ${others}</span><button class="btn btn-primary btn-sm" data-view="all">Показать</button></div>`
        : market && f.fav && !fav.list().length ? `<div class="empty"><b class="h3">Здесь будут ваши акции</b><span class="muted small">Нажмите на звёздочку у бумаги</span></div>`
        : `<div class="empty"><b class="h3">Ничего не нашли</b><span class="muted small">${market ? "Измените запрос или уберите фильтры" : "Попробуйте название, ИНН или ISIN"}</span><button class="btn btn-primary btn-sm" data-reset>Сбросить</button></div>`;
      more.hidden = true;
      return;
    }
    list.innerHTML = market
      ? `<div class="stk-list"><div class="stk stk-headrow" aria-hidden="true"><div>Компания</div><div>Цена</div><div>Последняя сделка</div><div>Оборот за 30 дней</div><div>Ликвидность</div><div></div></div>${rows.slice(0, shown).map(stockRow).join("")}</div>`
      : `<div class="stk-list"><div class="stk stk-co stk-headrow" aria-hidden="true"><div>Компания</div><div>Акций выпущено</div><div>Номинал</div><div>Статус</div></div>${rows.slice(0, shown).map(issuerRow).join("")}</div>`;
    more.hidden = rows.length <= shown;
    if (!more.hidden) more.textContent = `Показать ещё ${Math.min(PAGE, rows.length - shown)} из ${rows.length - shown}`;
  }

  // фильтры — в адресе: «Назад» со страницы бумаги вернёт тот же список, ссылкой можно поделиться
  function syncUrl() {
    const p = new URLSearchParams();
    if (f.view === "all") p.set("view", "all");
    if (f.q) p.set("q", f.q);
    for (const k of ["sector", "kind", "liq", "deal", "cat", "region"]) if (f[k]) p.set(k, f[k]);
    if (f.fav) p.set("fav", "1");
    if (f.sort !== "active") p.set("sort", f.sort);
    const qs = p.toString();
    try { sessionStorage.setItem(LIST_KEY, qs); } catch { /* приватный режим */ }
    history.replaceState(null, "", href(`#/stocks${qs ? `?${qs}` : ""}`));
  }
  const repaint = () => { shown = PAGE; paintChips(); paintList(); syncUrl(); };

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.view) { f.view = d.view; if (f.view === "market") f.region = ""; $$(".stk-ctl [data-view]", root).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.view === f.view))); }
    else if (d.sector) f.sector = f.sector === d.sector ? "" : d.sector;
    else if (d.favonly) f.fav = !f.fav;
    else if ("moref" in d) { moreOpen = !moreOpen; paintChips(); return; }
    else if (d.fKind) f.kind = f.kind === d.fKind ? "" : d.fKind;
    else if (d.fLiq) f.liq = f.liq === d.fLiq ? "" : d.fLiq;
    else if (d.fDeal) f.deal = f.deal === d.fDeal ? "" : d.fDeal;
    else if (d.fCat) f.cat = f.cat === d.fCat ? "" : d.fCat;
    else if ("reset" in d) { Object.assign(f, { q: "", sector: "", kind: "", liq: "", deal: "", cat: "", fav: false, region: "" }); $("#sq", root).value = ""; }
    else if (d.fav) { const on = fav.toggle(d.fav); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Убрать из моих акций" : "В мои акции"); paintChips(); if (f.fav) paintList(); return; }
    else if (d.buy) { openBuy(all.find((s) => s.t === d.buy)); return; }
    else if (b.id === "more") { shown += PAGE; paintList(); return; }
    else return;
    repaint();
    // список перерисован — фокус остаётся на той же кнопке
    const again = d.sector ? `[data-sector="${d.sector}"]` : d.fKind ? `[data-f-kind="${d.fKind}"]` : d.fLiq ? `[data-f-liq="${d.fLiq}"]` : d.fDeal ? `[data-f-deal="${d.fDeal}"]` : d.fCat ? `[data-f-cat="${d.fCat}"]` : null;
    if (again) $(again, root)?.focus({ preventScroll: true });
  });
  root.addEventListener("change", (e) => {
    if (e.target.id === "sort") { f.sort = e.target.value; repaint(); }
    else if (e.target.id === "region") { f.region = e.target.value; repaint(); }
  });
  let typing;
  const sq = $("#sq", root);
  sq.addEventListener("input", () => { clearTimeout(typing); typing = setTimeout(() => { f.q = sq.value.trim(); repaint(); }, 150); });
  sq.addEventListener("keydown", (e) => { if (e.key === "Enter") sq.blur(); });

  paintChips(); paintList();
  document.title = `${tr("Акции Узбекистана")} — Moliq`;
  return () => clearTimeout(typing);
}

// ════════════════════════════════ «Где купить» ════════════════════════════════

/** Окно «Где купить»: только официальные источники — брокеры биржи, реестр лицензий НАПП. Moliq сделок не проводит */
export function openBuy(s) {
  const loc = lang();
  const link = (url, title, sub) => `<a class="buy-link" href="${url}" target="_blank" rel="noopener"><div><b>${title}</b><span>${sub}</span></div>${icon("ext")}</a>`;
  openLayer(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="buy-t">
    <div class="sheet-head"><h2 id="buy-t">Где купить акции</h2><button class="icon-btn" data-close aria-label="Закрыть">${icon("x")}</button></div>
    <div class="sheet-pad">
      <p class="small">Акции покупают через брокера — лицензированного инвестиционного посредника. Moliq сделок не проводит.</p>
      ${s ? `<div class="buy-code"><div class="kv"><div class="k">Тикер</div><div class="v">${esc(s.t)}</div></div><div class="kv"><div class="k">Код бумаги</div><div class="v num">${esc(s.code)}</div></div></div>` : ""}
      <div class="buy-links">
        ${link(`${UZSE}/exchange/members/?locale=${loc}`, "Брокеры — члены биржи", "Список на сайте биржи «Тошкент»")}
        ${link(`https://napp.uz/${loc === "en" ? "en" : "ru"}/pages/qimmatli-qog-ozlar-bozorida-faoliyatni-litsenziyalash`, "Проверить лицензию брокера", "Реестр НАПП")}
        ${link("https://fondbozori.uz", "Fondbozori.uz", "Торговая система биржи")}
        ${link(`${UZSE}/exchange/how_to_start_investing?locale=${loc}`, "Как начать инвестировать", "Инструкция биржи")}
      </div>
    </div>
  </div>`);
}

// ════════════════════════════════ Страница бумаги ════════════════════════════════

const fact = (k, v) => (v == null || v === "" ? "" : `<div class="kv"><div class="k">${k}</div><div class="v">${esc(v)}</div></div>`);
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const monthOf = (ym) => `за ${MONTHS[Number(ym.slice(5, 7)) - 1]}`;
const tashTime = (iso) => {
  const d = new Date(iso);
  return `${new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit" }).format(d)}, ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(d)}`;
};

async function stockPage(root, data, t) {
  const s = data.stocks.find((x) => x.t === t);
  const backQs = (() => { try { return sessionStorage.getItem(LIST_KEY) || ""; } catch { return ""; } })();
  const back = `<a class="link stk-back" href="#/stocks${backQs ? `?${esc(backQs)}` : ""}">${icon("left", "ic-s")}Все акции</a>`;
  if (!s) {
    root.innerHTML = `<div class="wrap page">${back}<div class="empty"><b class="h3">Такой бумаги нет на бирже</b><span class="muted small">Возможно, тикер изменился</span><a class="btn btn-primary btn-sm" href="#/stocks">Все акции</a></div></div>`;
    return;
  }
  window.scrollTo(0, 0);
  const issuer = s.inn ? data.issuers.find((i) => i.inn === s.inn) : null;
  const fr = freshness(s), ch = dayChange(s);
  const siblings = data.stocks.filter((x) => x.t !== s.t && x.status !== "gone" && (s.inn ? x.inn === s.inn : x.t.replace(/P$/, "") === s.t.replace(/P$/, "")));
  const fetched = s.fetched || data.fetchedAt;

  // ── Предупреждения: только факты, без оценок «хорошая / плохая» ──
  const risks = [];
  if (s.status === "gone") risks.push(["Торги прекращены", `Бумаги нет в списках биржи с ${dateRu(s.gone)}.`]);
  if (fr.k === "stale") risks.push(["Старая цена", `С последней сделки прошло ${ago(fr.n)}.`]);
  else if (fr.k === "old") risks.push(["Давно не было сделок", `С последней сделки прошло ${ago(fr.n)}.`]);
  if (s.m30 && s.m30.days > 0 && s.m30.days < 10) risks.push(["Редкие сделки", `За 30 дней сделки были только в ${s.m30.days} ${plural(s.m30.days, ["день", "дня", "дней"])}.`]);
  if (s.liq?.lvl === "low") risks.push(["Низкая ликвидность", "Так бумагу оценивает биржа: продать её быстро может быть трудно."]);
  if (s.status === "otc") risks.push(["Вне котировального листа", "Бумага торгуется на бирже, но не входит в её котировальный лист."]);

  const line = (k, v, sub = "") => (v == null || v === "" ? "" : `<div class="stk-line"><span>${k}</span><b class="num">${v}${sub ? ` <small>${sub}</small>` : ""}</b></div>`);
  const loc = lang();
  const uzsePage = `${UZSE}/isu_infos/STK?isu_cd=${encodeURIComponent(s.code)}&locale=${loc}`;
  root.innerHTML = `<div class="wrap page stk-page">
    ${back}
    <div class="stk-title">
      ${ava(s, "lg")}
      <div><h1>${esc(s.name)}</h1><div class="stk-sub"><b>${esc(s.t)}</b><span> · </span><span>${esc(subline(s))}</span></div></div>
      ${favBtn(s.t)}
    </div>
    <div class="stk-top">
      <div class="card stk-hero">
        <div class="stk-price">
          ${s.last ? `<div class="fx-rate num${fr.k === "stale" ? " dim" : ""}">${fmt2(s.last.p)}<small>сум</small></div>${s.last.d === data.session || fr.k === "ok" ? chgHtml(ch, true) : ""}` : `<div class="fx-rate dim">Нет цены</div>`}
        </div>
        <p class="stk-when">${s.last ? `<span>${fr.k === "stale" ? "Последняя цена сделки:" : "Последняя сделка:"}</span> <span class="num">${esc(dateRu(s.last.d))}${s.last.tm ? `, ${esc(s.last.tm)}` : ""}</span>` : "<span>Сделок в наших данных нет</span>"}<span> · </span><a class="link" href="${uzsePage}" target="_blank" rel="noopener">биржа «Тошкент»</a></p>
        ${fr.k === "stale" ? `<p class="stk-warn">Актуальной рыночной цены нет — с последней сделки прошло ${ago(fr.n)}.</p>` : ""}
        <div class="stk-tools">
          <div class="seg seg-scroll" role="group" aria-label="Период" id="periods">${PERIODS.map(([v, n]) => `<button data-p="${v}" aria-pressed="false">${n}</button>`).join("")}</div>
          <div class="seg" role="group" aria-label="Что показать на графике" id="modes"><button data-m="price" aria-pressed="true">Цена</button><button data-m="value" aria-pressed="false">Оборот</button></div>
        </div>
        <div class="stk-chart" id="chart"><div class="stk-chart-empty muted small">Загружаем график…</div></div>
        <p class="cap stk-cap" id="chart-cap"></p>
        ${fetched ? `<p class="cap"><span>Получено Moliq</span> <span class="num">${esc(tashTime(fetched))}</span><span> · </span><span>обновляем дважды в день</span></p>` : ""}
      </div>
      <div class="card stk-side">
        <h2 class="h3">Ключевые показатели</h2>
        <div class="stk-lines">
          ${line("Оборот за день", s.day?.v != null ? money(s.day.v) : null, s.last ? dShort(s.last.d) : "")}
          ${line("Сделок за день", s.day?.n != null ? fmt(s.day.n) : null)}
          ${line("Оборот за 30 дней", s.m30 ? (s.m30.days ? money(s.m30.v) : "—") : null)}
          ${line("Дней со сделками за 30 дней", s.m30 ? fmt(s.m30.days) : null)}
          ${line("Сделок за месяц", s.liq ? fmt(s.liq.trades) : null, data.liquidityPeriod ? monthOf(data.liquidityPeriod) : "")}
          ${line("Брокеров в торгах", s.liq ? fmt(s.liq.members) : null, data.liquidityPeriod ? monthOf(data.liquidityPeriod) : "")}
          ${line("Ликвидность по оценке биржи", s.liq?.lvl ? `<span class="liq ${s.liq.lvl}">${LIQ[s.liq.lvl]}</span>` : null, s.liq?.score != null ? `${s.liq.score} из 12` : "")}
          ${line("Номинал", s.nominal ? price(s.nominal) : null)}
          ${line("Акций в листинге", s.listed ? fmt(s.listed) : null)}
          ${line("Категория листинга", s.status === "listed" ? CAT[s.cat] : null)}
          ${line("Код бумаги", esc(s.code))}
        </div>
        <button class="btn btn-primary btn-block" data-buy>Где купить ${icon("arrow")}</button>
      </div>
    </div>
    ${risks.length ? `<section class="sec" aria-labelledby="risk-t"><div class="sec-head"><h2 id="risk-t">На что обратить внимание</h2></div>
      <ul class="stk-risk">${risks.map(([title, text]) => `<li>${icon("info")}<div><b>${title}</b><span>${text}</span></div></li>`).join("")}</ul></section>` : ""}
    <section class="sec" aria-labelledby="co-t"><div class="sec-head"><h2 id="co-t">О компании</h2></div>
      <div class="card stk-about">
        <div class="facts">
          ${fact("Полное название", s.full ? s.full.replace(/[<>]/g, "\"") : null)}
          ${fact("Отрасль", SECTOR[s.sector])}
          ${fact("Область", issuer?.r)}
          ${fact("ИНН", issuer?.inn)}
          ${fact("Акций выпущено", issuer?.sh ? fmt(issuer.sh) : null)}
          ${fact("В листинге с", s.since ? dateRu(s.since) : null)}
        </div>
        ${siblings.length ? `<div class="stk-sibs"><span class="cap">Другие акции компании</span>${siblings.map((x) => `<a class="chip chip-soft" href="#/stocks/${esc(x.t)}">${esc(x.t)} · ${KIND[x.kind]}</a>`).join("")}</div>` : ""}
        <div class="details-act">
          <a class="btn btn-line btn-sm" href="https://openinfo.uz/${loc}/organizations?q=${encodeURIComponent(issuer?.inn || s.name)}" target="_blank" rel="noopener">Отчётность и события — Openinfo ${icon("ext", "ic-s")}</a>
          <a class="btn btn-line btn-sm" href="${uzsePage}" target="_blank" rel="noopener">Страница на бирже ${icon("ext", "ic-s")}</a>
        </div>
      </div>
    </section>
    <p class="cap list-note">Информация — не инвестиционная рекомендация и не гарантия дохода: цена акций может и расти, и падать. Перед сделкой проверьте данные у биржи и брокера.</p>
  </div>`;
  document.title = `${s.t} — ${s.name} — Moliq`;

  let period = null, mode = "price", ro = null, gone = false, rows = [];
  const box = $("#chart", root);
  const paint = () => {
    $$("[data-p]", root).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.p === period)));
    $$("[data-m]", root).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.m === mode)));
    drawChart(box, rows, { period, mode, end: today(), cap: $("#chart-cap", root), lastTrade: s.last });
  };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.fav) { const on = fav.toggle(b.dataset.fav); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Убрать из моих акций" : "В мои акции"); }
    else if ("buy" in b.dataset) openBuy(s);
    else if (b.dataset.p && rows.length) { period = b.dataset.p; paint(); }
    else if (b.dataset.m && rows.length) { mode = b.dataset.m; paint(); }
  });

  // ── График: история — отдельным файлом ──
  let hist = null;
  try { hist = await stockHistory(s.t); } catch { hist = null; }
  if (gone) return;
  rows = (hist?.d ?? []).filter((r) => r[4] > 0);
  if (!rows.length) {
    // файл есть, но пустой — биржа не показывает ни одной сделки с бумагой; файла нет — мы ещё не открывали её страницу
    box.innerHTML = hist ? `<div class="stk-chart-empty"><b>Сделок в истории биржи нет</b><span class="muted small">Биржа не показывает ни одной сделки с этой бумагой</span></div>`
      : `<div class="stk-chart-empty"><b>Истории цен пока нет</b><span class="muted small">Она появится после следующего обновления данных</span></div>`;
    $("#periods", root).hidden = true;
    $("#modes", root).hidden = true;
    return () => { gone = true; };
  }
  // период по умолчанию — самый короткий, где видно хотя бы пять дней со сделками
  const end = today();
  const inWin = (p) => rows.filter((r) => r[0] > addDays(end, -Number(p))).length;
  period = ["91", "365", "1095"].find((p) => inWin(p) >= 5) ?? "all";
  paint();
  if (typeof ResizeObserver === "function") {
    let w = box.clientWidth;
    ro = new ResizeObserver(() => { if (Math.abs(box.clientWidth - w) > 4) { w = box.clientWidth; paint(); } });
    ro.observe(box);
  }
  return () => { gone = true; ro?.disconnect(); };
}

// ════════════════════════════════ График ════════════════════════════════
// Ось X — время, а не номер точки: пропуски видны. Соседние дни со сделками соединены линией, если между ними не больше
// недели; дольше — пунктир и подпись «нет сделок N дн.». Свечей за дни без сделок нет, нулевой цены нет.

function drawChart(box, rows, { period, mode, end, cap, lastTrade }) {
  const from = period === "all" ? rows[0][0] : addDays(end, -Number(period));
  const pts = rows.filter((r) => r[0] >= from && r[0] <= end);
  if (!pts.length) {
    box.innerHTML = `<div class="stk-chart-empty"><b>За этот период сделок не было</b>${lastTrade ? `<span class="muted small">Последняя сделка — ${esc(dateRu(lastTrade.d))}</span>` : ""}</div>`;
    cap.innerHTML = "";
    return;
  }
  const W = Math.max(280, Math.round(box.clientWidth || 640)), H = W < 500 ? 190 : 230;
  const pad = { l: 6, r: 6, t: 16, b: 28 };
  const t0 = dayMs(from), t1 = Math.max(dayMs(end), dayMs(pts[pts.length - 1][0]));
  const span = Math.max(86_400_000, t1 - t0);
  const x = (iso) => pad.l + ((dayMs(iso) - t0) / span) * (W - pad.l - pad.r);
  const val = (r) => (mode === "value" ? r[6] ?? r[4] * r[5] : r[4]);
  const vs = pts.map(val);
  const lo = mode === "value" ? 0 : Math.min(...vs), hi = Math.max(...vs);
  const range = hi - lo || hi || 1;
  const y = (v) => pad.t + (1 - (v - lo) / range) * (H - pad.t - pad.b);
  const f1 = (n) => n.toFixed(1);
  const base = H - pad.b;
  let svg = "";
  const gaps = [];
  if (mode === "price") {
    // отрезки без больших пропусков: у каждого своя линия и заливка
    let seg = [];
    const flush = () => {
      if (seg.length > 1) {
        const d = seg.map((r, i) => `${i ? "L" : "M"}${f1(x(r[0]))} ${f1(y(r[4]))}`).join(" ");
        svg += `<path class="a" d="${d} L${f1(x(seg[seg.length - 1][0]))} ${base} L${f1(x(seg[0][0]))} ${base} Z"/><path class="l" d="${d}"/>`;
      }
      seg = [];
    };
    pts.forEach((r, i) => {
      const prev = pts[i - 1];
      if (prev && daysBetween(prev[0], r[0]) > GAP_DAYS) {
        flush();
        gaps.push({ a: prev, b: r, n: daysBetween(prev[0], r[0]) - 1 });
        svg += `<path class="gap" d="M${f1(x(prev[0]))} ${f1(y(prev[4]))} L${f1(x(r[0]))} ${f1(y(r[4]))}"/>`;
      }
      seg.push(r);
    });
    flush();
    // точки: все, если их немного; иначе — только одиночные дни (у них нет линии)
    const lonely = (i) => !(pts[i - 1] && daysBetween(pts[i - 1][0], pts[i][0]) <= GAP_DAYS) && !(pts[i + 1] && daysBetween(pts[i][0], pts[i + 1][0]) <= GAP_DAYS);
    pts.forEach((r, i) => { if (pts.length <= 60 || lonely(i)) svg += `<circle class="${r[7] ? "pt part" : "pt"}" cx="${f1(x(r[0]))}" cy="${f1(y(r[4]))}" r="${lonely(i) ? 3.5 : 2.5}"/>`; });
  } else {
    const days = Math.max(1, span / 86_400_000), bw = Math.max(2, Math.min(14, ((W - pad.l - pad.r) / days) * 0.7));
    for (const r of pts) svg += `<rect class="${r[7] ? "bar part" : "bar"}" x="${f1(x(r[0]) - bw / 2)}" y="${f1(y(val(r)))}" width="${f1(bw)}" height="${f1(Math.max(1, base - y(val(r))))}" rx="1.5"/>`;
    for (let i = 1; i < pts.length; i++) { const n = daysBetween(pts[i - 1][0], pts[i][0]); if (n > GAP_DAYS) gaps.push({ a: pts[i - 1], b: pts[i], n: n - 1 }); }
  }
  // после последней сделки до сегодня — тоже пропуск, если он длиннее недели
  const lastPt = pts[pts.length - 1], tail = daysBetween(lastPt[0], end);
  if (tail > GAP_DAYS) gaps.push({ a: lastPt, b: null, n: tail });
  let labels = `<line class="base" x1="${pad.l}" x2="${W - pad.r}" y1="${base}" y2="${base}"/>`;
  for (const g of gaps) {
    const x1 = x(g.a[0]), x2 = g.b ? x(g.b[0]) : W - pad.r;
    if (x2 - x1 >= 96) labels += `<text class="gap-t" x="${f1((x1 + x2) / 2)}" y="${base - 6}" text-anchor="middle">нет сделок ${g.n} дн.</text>`;
  }
  labels += `<text class="ax" x="${pad.l}" y="${H - 8}">${dShort(from)}</text><text class="ax" x="${W - pad.r}" y="${H - 8}" text-anchor="end">${dShort(end)}</text>`;
  const what = mode === "value" ? "Оборот по дням" : "Цена закрытия по дням";
  box.innerHTML = `<div class="chart-box stk-box" tabindex="0" role="group" aria-label="${what}: ${pts.length} ${plural(pts.length, ["день", "дня", "дней"])} со сделками">
    <svg class="stk-svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true">${svg}${labels}</svg>
    <i class="chart-line" hidden></i><i class="chart-dot" hidden></i><div class="chart-tip" role="status" hidden></div>
  </div>`;
  const fmtV = (v) => (mode === "value" ? money(v) : price(v));
  cap.innerHTML = `<span>${pts.length} ${plural(pts.length, ["день", "дня", "дней"])} со сделками</span><span class="num">${fmtV(Math.min(...vs))} – ${fmtV(Math.max(...vs))}</span>`;
  bindStockChart($(".stk-box", box), { pts, gaps, x, y, val, W, H, base, mode, end });
}

function bindStockChart(el, { pts, gaps, x, y, val, W, H, base, mode, end }) {
  if (!el) return;
  const vline = $(".chart-line", el), dot = $(".chart-dot", el), tip = $(".chart-tip", el);
  let at = -1;
  const hide = () => { at = -1; vline.hidden = dot.hidden = tip.hidden = true; };
  const kx = () => (el.clientWidth || W) / W, ky = () => (el.clientHeight || H) / H;
  const place = (px, py, html) => {
    tip.innerHTML = html;
    vline.hidden = tip.hidden = false;
    const w = el.clientWidth || W;
    vline.style.left = `${px * kx()}px`;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.max(half, Math.min(w - half, px * kx()))}px`;
    tip.style.top = `${Math.max(tip.offsetHeight + 8, py * ky())}px`;
  };
  const showPoint = (i) => {
    i = Math.max(0, Math.min(pts.length - 1, i));
    at = i;
    const r = pts[i], prev = pts[i - 1], px = x(r[0]), py = mode === "value" ? y(val(r)) : y(r[4]);
    const ch = prev && mode === "price" ? ((r[4] - prev[4]) / prev[4]) * 100 : null;
    dot.hidden = mode !== "price";
    dot.style.left = `${px * kx()}px`;
    dot.style.top = `${py * ky()}px`;
    const chTxt = ch != null && Math.abs(ch) >= 0.05 ? `<span class="chg ${ch > 0 ? "up" : "down"} num">${ch > 0 ? "▲" : "▼"} ${pct1(Math.abs(ch))} к ${dShort(prev[0])}</span>` : "";
    const qty = r[5] ? `<span class="cap num">${fmt(r[5])} шт.${r[6] ? ` · ${money(r[6])}` : ""}</span>` : "";
    place(px, py, `<span class="cap num">${esc(dateRu(r[0]))}${r[7] ? " · день не закончен" : ""}</span><b class="num">${mode === "value" ? money(val(r)) : price(r[4])}</b>${mode === "price" ? chTxt + qty : `<span class="cap num">Цена закрытия ${price(r[4])}</span>`}`);
  };
  const showGap = (g, iso, px) => {
    at = -1;
    dot.hidden = true;
    place(px, 48, `<span class="cap num">${esc(dateRu(iso))}</span><b>Сделок не было</b><span class="cap num">Последняя цена — ${price(g.a[4])} от ${esc(dateRu(g.a[0]))}</span>`);
  };
  const point = (e) => {
    const rect = el.getBoundingClientRect(), px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(x(pts[i][0]) - px) < Math.abs(x(pts[best][0]) - px)) best = i;
    // в пропуске больше недели — подсказка «сделок не было», а не ближайшая цена
    const near = Math.abs(x(pts[best][0]) - px) < 10;
    const g = !near && gaps.find((q) => px > x(q.a[0]) && px < (q.b ? x(q.b[0]) : W));
    if (!g) return showPoint(best);
    const a = dayMs(g.a[0]), b = g.b ? dayMs(g.b[0]) : dayMs(end);
    const x2 = g.b ? x(g.b[0]) : W - 6;
    const frac = Math.max(0, Math.min(1, (px - x(g.a[0])) / Math.max(1, x2 - x(g.a[0]))));
    const iso = new Date(a + Math.round(((b - a) * frac) / 86_400_000) * 86_400_000).toISOString().slice(0, 10);
    showGap(g, iso, px);
  };
  void base;
  el.addEventListener("pointermove", point);
  el.addEventListener("pointerdown", point);
  el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
  el.addEventListener("blur", hide);
  el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); showPoint((at < 0 ? pts.length - 1 : at) + (e.key === "ArrowLeft" ? -1 : 1)); }
    else if (e.key === "Escape") hide();
  });
}
