// Главная: без приветствия. Сразу дела — кредит, вклад, карта, курс, банкомат.
import { $, $$, esc, icon, flag, sticker, fmt, fmt2, short, pct, term, plural, moneyInput } from "../lib.js";
import { db, atmsHome, gold, p2p, stocks, stats, fxBest, fxDelta, bankName, LOAN_TYPES } from "../data.js";
import { store, save, go } from "../store.js";
import { href } from "../nav.js";
import { bankLogo, rateRange } from "../app.js";
import { atmMap, countAtms } from "../mapkit.js";

const FX = [["USD", "Доллар"], ["EUR", "Евро"], ["RUB", "Рубль"]];
const BEST_TABS = [["dep", "Вклады"], ["depusd", "Вклады в долларах"], ["micro", "Микрозаймы"], ["auto", "Автокредиты"], ["mortgage", "Ипотека"], ["cards", "Карты"]];
const MAP_CHIPS = [["s1", "Humo"], ["s0", "Uzcard"], ["s2", "Visa"], ["fx", "Валюта"], ["cashIn", "Пополнение"], ["h24", "Круглосуточно"]];

export default async function home(root) {
  const loanN = db.loans.length, bankN = db.banks.length;
  root.innerHTML = `<div class="wrap page">
    <h1 class="sr">Moliq — кредиты, вклады, карты и курсы банков Узбекистана</h1>

    <section class="tiles" aria-label="Что вам нужно">
      <div class="tile tile-big">
        <h2 class="tile-t"><a href="#/credits">Взять кредит</a></h2>
        <p class="tile-h" data-i18n="hint-loans"><b class="num">${loanN}</b> ${plural(loanN, ["предложение", "предложения", "предложений"])} от <b class="num">${bankN}</b> ${plural(bankN, ["банка", "банков", "банков"])}</p>
        <form class="tile-form" id="loan-go">
          <label class="field has-suffix"><span>Сколько вам нужно</span><input id="t-amount" inputmode="numeric" placeholder="20 000 000" autocomplete="off"><i class="suffix">сум</i></label>
          <button class="btn btn-primary" aria-label="Показать предложения"><span>Показать</span> ${icon("arrow")}</button>
        </form>
        <div class="tile-links">${LOAN_TYPES.map((t) => `<a class="chip chip-soft" href="#/credits/${t.id}">${t.name}</a>`).join("")}</div>
        ${sticker("wallet")}
      </div>
      <div class="tile"><h2 class="tile-t"><a href="#/deposits">Открыть вклад</a></h2><p class="tile-h" data-i18n="hint-dep">до <b class="num">${pct(stats.depMax("UZS"))}</b> годовых</p>${sticker("percent")}</div>
      <div class="tile"><h2 class="tile-t"><a href="#/cards">Выбрать карту</a></h2><p class="tile-h"><b class="num">${db.cards.length}</b> ${plural(db.cards.length, ["карта", "карты", "карт"])}</p>${sticker("card")}</div>
      <div class="tile"><h2 class="tile-t"><a href="#/rates">Обменять валюту</a></h2><p class="tile-h">Доллар — <b class="num">${fmt(db.rates.cbu.USD)}</b> сум</p>${sticker("swap")}</div>
      <div class="tile"><h2 class="tile-t"><a href="#/map">Найти банкомат</a></h2><p class="tile-h" id="atm-n">По всему Узбекистану</p>${sticker("pin")}</div>
      <div class="tile tile-wide"><h2 class="tile-t"><a href="#/transfers">Перевести без комиссии</a></h2><p class="tile-h" id="p2p-h">С карты на карту</p>${sticker("send")}</div>
      <div class="tile"><h2 class="tile-t"><a href="#/rates/gold">Купить золото</a></h2><p class="tile-h" id="gold-h">Слитки Центрального банка</p>${sticker("gold")}</div>
      <div class="tile tile-stocks"><h2 class="tile-t"><a href="#/stocks">Акции</a></h2><p class="tile-h" id="stk-h">Биржа «Тошкент»</p>${sticker("chart")}</div>
    </section>

    <div class="check-bar">
      <div><h2>Какой кредит вам по силам?</h2></div>
      <a class="btn btn-lime" href="#/check">Проверить ${icon("arrow")}</a>
    </div>

    <section class="sec" aria-labelledby="fx-t">
      <div class="sec-head"><h2 id="fx-t">Курсы валют</h2><a class="link" href="#/rates">Все банки ${icon("right", "ic-s")}</a></div>
      <div class="fx">${FX.map(([cur, name]) => fxCard(cur, name)).join("")}</div>
    </section>

    <section class="sec" aria-labelledby="best-t">
      <div class="sec-head"><h2 id="best-t">Лучшие предложения</h2></div>
      <div class="seg seg-scroll" role="group" aria-label="Вид продукта" id="best-tabs">${BEST_TABS.map(([id, name], i) => `<button data-best="${id}" aria-pressed="${i === 0}">${name}</button>`).join("")}</div>
      <div class="best" id="best"></div>
    </section>

    <section class="sec" aria-labelledby="map-t">
      <div class="mapt">
        <div class="mapt-l">
          <h2 id="map-t">Банкоматы на карте</h2>
          <div class="chips" id="map-chips">${MAP_CHIPS.map(([id, name]) => `<button class="chip chip-soft" data-mf="${id}" aria-pressed="false">${name}</button>`).join("")}</div>
          <a class="btn btn-primary" id="map-open" href="#/map">Открыть карту ${icon("arrow")}</a>
        </div>
        <div class="mapt-r"><span class="mapt-count num" id="map-count" hidden></span><div class="mapbox" id="mini-map" role="img" aria-label="Карта банкоматов Ташкента"></div></div>
      </div>
    </section>

    <section class="sec" aria-labelledby="ask-t">
      <div class="ask">
        <div><h2 id="ask-t">Спросите Moliq AI</h2></div>
        <div>
          <form class="ask-form" id="ask"><input name="q" placeholder="Например: какие документы нужны для ипотеки" aria-label="Вопрос помощнику" autocomplete="off"><button class="btn btn-primary" aria-label="Спросить">${icon("send")}</button></form>
          <div class="chips">${["Хочу получить кредит", "Где выгоднее купить доллары", "Вклад с пополнением"].map((q) => `<a class="chip chip-soft" href="#/chat?q=${encodeURIComponent(q)}">${q}</a>`).join("")}</div>
        </div>
      </div>
    </section>
  </div>`;

  // ── Сумма в плитке: ввёл — и сразу в список ──
  moneyInput($("#t-amount", root), (n) => { store.loan.amount = n; save(); }).set(store.loan.amount);
  $("#loan-go", root).addEventListener("submit", (e) => { e.preventDefault(); go("#/credits"); });

  // ── Лучшие предложения ──
  const bestBox = $("#best", root);
  function paintBest(tab) {
    const onePerBank = (items) => { const seen = new Set(); return items.filter((x) => (seen.has(x.bankId) ? false : (seen.add(x.bankId), true))).slice(0, 4); };
    let html = "";
    if (tab === "dep" || tab === "depusd") {
      const cur = tab === "dep" ? "UZS" : "USD";
      const list = onePerBank(db.deposits.filter((d) => d.cur === cur && d.rate != null).sort((a, b) => b.rate - a.rate));
      html = list.map((d) => bestCard(`#/deposits?cur=${cur}&open=${d.id}`, d, [["Ставка", pct(d.rate)], ["Срок", d.termHi ? term(d.termHi) : "—"]])).join("");
    } else if (tab === "cards") {
      const list = onePerBank(db.cards.filter((c) => c.issue === 0 && c.cur === "UZS").sort((a, b) => Number(b.online) - Number(a.online)));
      html = list.map((c) => bestCard(`#/cards?open=${c.id}`, c, [["Выпуск", "Бесплатно"], ["Система", c.systems.join(", ")]])).join("");
    } else {
      const list = onePerBank(db.loans.filter((l) => l.type === tab && !l.targeted && l.rateHi != null && l.rateLo > 0).sort((a, b) => a.rateHi - b.rateHi));
      html = list.map((l) => bestCard(`#/credits/${tab}?open=${l.id}`, l, [["Ставка", rateRange(l)], ["Сумма", l.max ? `до ${short(l.max)}` : "—"]])).join("");
    }
    bestBox.innerHTML = html;
    bestBox.scrollLeft = 0;
  }
  paintBest("dep");

  // ── Мини-карта: настоящая, с настоящими банкоматами ──
  const mf = new Set();
  const filterOf = () => ({ sys: [...mf].filter((k) => k[0] === "s" && k.length === 2).map((k) => Number(k[1])), flags: [...mf].filter((k) => !(k[0] === "s" && k.length === 2)) });
  let mini = null, atmData = null, gone = false;
  const paintCount = () => {
    if (!atmData) return;
    // числа по всей стране посчитаны заранее для каждого сочетания кнопок (atms-home.json); в файле — только центр Ташкента
    const n = atmData.counts?.[[...mf].sort().join(",")] ?? countAtms(atmData, filterOf());
    const el = $("#map-count", root);
    el.hidden = false;
    el.textContent = `${fmt(n)} ${plural(n, ["банкомат", "банкомата", "банкоматов"])}`;
    $("#map-open", root).setAttribute("href", href(mf.size ? `#/map?f=${[...mf].join(",")}` : "#/map"));
  };
  atmsHome().then((data) => {
    if (gone) return;
    atmData = data;
    const total = data.total ?? data.atms.length;
    $("#atm-n", root).innerHTML = `<b class="num">${fmt(total)}</b> на карте`;
    paintCount();
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      atmMap($("#mini-map", root), data, { zoom: 11.2, interactive: false, filter: filterOf() }).then((m) => { if (gone) m.remove(); else mini = m; }).catch(() => { /* без сети карта остаётся серой */ });
    }, { rootMargin: "300px" });
    io.observe($("#mini-map", root));
  }).catch(() => { /* счётчик просто не появится */ });

  // ── Подсказки в плитках переводов и золота: числа из данных, без них остаётся общая подпись ──
  p2p().then((d) => {
    // лимит, который годится для любой пары карт Uzcard и Humo (а не только Humo → Humo, где он в десять раз больше)
    const top = Math.max(0, ...d.apps.filter((a) => !a.ownCard).flatMap((a) => a.rules.filter((r) => r.from.length > 1 && r.to.length > 1).map((r) => r.limit)));
    // элемент заменяется целиком: так переводчик видит новую подсказку и подставляет её шаблон на нужном языке
    if (!gone && top) $("#p2p-h", root).outerHTML = `<p class="tile-h" id="p2p-h" data-i18n="hint-p2p">до <b class="num">${short(top)}</b> в месяц в одном приложении</p>`;
  }).catch(() => {});
  gold().then((d) => {
    const bar = d.bars[0];
    if (!gone && bar) $("#gold-h", root).outerHTML = `<p class="tile-h" id="gold-h" data-i18n="hint-gold">Слиток <b class="num">${bar.g}</b> г — <b class="num">${fmt(bar.sell)}</b> сум</p>`;
  }).catch(() => {});
  stocks().then((d) => {
    const n = d.stocks.filter((s) => s.status !== "gone").length;
    if (!gone && n) $("#stk-h", root).outerHTML = `<p class="tile-h" id="stk-h" data-i18n="hint-stocks"><b class="num">${n}</b> ${plural(n, ["бумага", "бумаги", "бумаг"])} на бирже</p>`;
  }).catch(() => {});

  // ── События ──
  root.addEventListener("click", (e) => {
    // нажатие на мини-карту открывает большую карту с теми же фильтрами (кроме кнопки «i» с источниками карты)
    if (e.target.closest(".mapt-r") && !e.target.closest(".maplibregl-ctrl")) { go($("#map-open", root).getAttribute("href")); return; }
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.best) { $$("[data-best]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintBest(b.dataset.best); }
    else if (b.dataset.mf) { const k = b.dataset.mf; mf.has(k) ? mf.delete(k) : mf.add(k); b.setAttribute("aria-pressed", String(mf.has(k))); paintCount(); mini?.setFilter(filterOf()); }
  });
  $("#ask", root).addEventListener("submit", (e) => { e.preventDefault(); const q = e.target.q.value.trim(); go(q ? `#/chat?q=${encodeURIComponent(q)}` : "#/chat"); });

  return () => { gone = true; mini?.remove(); };
}

function fxCard(cur, name) {
  const cbu = db.rates.cbu[cur], d = fxDelta(cur), best = fxBest(cur);
  const delta = d === 0 ? `<span class="delta flat">без изменений</span>` : `<span class="delta ${d > 0 ? "up" : "down"} num">${d > 0 ? "▲" : "▼"} ${fmt2(Math.abs(d))}</span>`;
  return `<a class="fx-card" href="#/rates/${cur}" aria-label="${name}: курсы банков">
    <div class="fx-top">${flag(cur)}<b>${name}</b>${delta}</div>
    <div class="fx-rate num">${fmt2(cbu)}<small>курс ЦБ</small></div>
    <div class="fx-two">
      <div class="kv"><div class="k">Купить дешевле</div><div class="v num">${best.cheapest ? fmt(best.cheapest.sell) : "—"}</div><div class="s">${esc(best.cheapest?.bank || "")}</div></div>
      <div class="kv"><div class="k">Продать дороже</div><div class="v num">${best.dearest ? fmt(best.dearest.buy) : "—"}</div><div class="s">${esc(best.dearest?.bank || "")}</div></div>
    </div>
  </a>`;
}
function bestCard(href, item, pairs) {
  return `<a class="best-card" href="${href}">
    <div class="best-head">${bankLogo(item.bankId)}<div><b>${esc(bankName(item.bankId))}</b><span>${esc(item.name)}</span></div></div>
    <div class="best-nums">${pairs.map(([k, v]) => `<div class="kv"><div class="k">${k}</div><div class="v num">${esc(v)}</div></div>`).join("")}</div>
  </a>`;
}
