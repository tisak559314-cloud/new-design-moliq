// Курсы валют: курс ЦБ, где купить дешевле и продать дороже, все банки.
import { $, $$, esc, flag, fmt, fmt2, moneyInput, CUR } from "../lib.js";
import { db, fxRows, fxBest, fxDelta } from "../data.js";
import { bankLogo, dateRu } from "../app.js";
import { chartHtml, bindChart } from "../chart.js";

const NAMES = { USD: "Доллар США", EUR: "Евро", RUB: "Российский рубль" };
const CHANNELS = [["any", "Все"], ["bank", "В отделении"], ["app", "В приложении"], ["atm", "В банкомате"]];

/** Переключатель страницы курсов: три валюты и золото */
export const fxSeg = (cur) => `<div class="seg seg-scroll" role="navigation" aria-label="Валюта">${Object.keys(NAMES).map((c) => `<a href="#/rates/${c}"${c === cur ? ' aria-current="page"' : ""}>${flag(c)}${c}</a>`).join("")}<a href="#/rates/gold"${cur === "gold" ? ' aria-current="page"' : ""}>${flag("XAU")}Золото</a></div>`;

export default async function rates(root, ctx) {
  const { path } = ctx;
  if (path[1] === "gold") return (await import("./gold.js")).default(root, ctx);
  const cur = NAMES[path[1]] ? path[1] : "USD";
  let channel = "any", mode = "buy", amount = null;
  // способы обмена — только те, по которым в данных есть курсы; один способ — переключатель не нужен
  const present = new Set(db.rates.rows.flatMap((r) => Object.values(r.rates || {}).flatMap((x) => Object.keys(x || {}))));
  const channels = CHANNELS.filter(([id]) => id === "any" || present.has(id));
  const cbu = db.rates.cbu[cur], d = fxDelta(cur);
  const delta = d === 0 ? `<span class="delta flat">без изменений</span>` : `<span class="delta ${d > 0 ? "up" : "down"} num">${d > 0 ? "▲" : "▼"} ${fmt2(Math.abs(d))} за день</span>`;

  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Курсы валют</h1>
      ${fxSeg(cur)}
    </div>
    <div class="rates-top">
      <div class="card rate-hero">
        <div><div class="fx-top">${flag(cur)}<b>${NAMES[cur]}</b>${delta}</div>
          <div class="fx-rate num">${fmt2(cbu)}<small>сум · курс ЦБ на ${esc(dateRu(db.rates.cbuDate))}</small></div></div>
        ${chartHtml(series(cur), { label: "Курс ЦБ за 30 дней", caption: "30 дней", f: fmt2 })}
        <div class="rate-trio" id="trio"></div>
      </div>
      <div class="card conv">
        <h2 class="h3">Сколько получится</h2>
        <div class="seg" role="group" aria-label="Что делаете"><button data-mode="buy" aria-pressed="true">Покупаю</button><button data-mode="sell" aria-pressed="false">Продаю</button></div>
        <label class="field has-suffix"><span>Сумма</span><input id="conv" inputmode="numeric" placeholder="Например, 1 000" autocomplete="off"><i class="suffix">${CUR[cur]}</i></label>
        <div class="conv-out" id="conv-out" aria-live="polite"></div>
      </div>
    </div>
    <section class="sec" aria-labelledby="banks-t">
      <div class="sec-head"><h2 id="banks-t">Курсы в банках</h2>
        ${channels.length > 2 ? `<div class="seg seg-scroll" role="group" aria-label="Где меняете">${channels.map(([id, name], i) => `<button data-ch="${id}" aria-pressed="${i === 0}">${name}</button>`).join("")}</div>` : ""}
      </div>
      <div class="tbl" id="tbl"></div>
    </section>
  </div>`;

  function paint() {
    const rows = fxRows(cur, channel), best = fxBest(cur, channel);
    $("#trio", root).innerHTML = `
      <div class="kv"><div class="k">Купить дешевле</div><div class="v num">${best.cheapest ? fmt(best.cheapest.sell) : "—"}</div><div class="s">${esc(best.cheapest?.bank || "Нет данных")}</div></div>
      <div class="kv"><div class="k">Продать дороже</div><div class="v num">${best.dearest ? fmt(best.dearest.buy) : "—"}</div><div class="s">${esc(best.dearest?.bank || "Нет данных")}</div></div>`;
    // сначала те, где дешевле купить
    rows.sort((a, b) => (a.sell ?? Infinity) - (b.sell ?? Infinity));
    // время обновления по каждому банку есть не в каждом источнике — без него колонка не нужна
    const dated = rows.some((r) => r.updated), cls = dated ? "tbl-row" : "tbl-row tbl-3";
    $("#tbl", root).innerHTML = rows.length ? `<div class="${cls} tbl-head"><div>Банк</div><div>Банк покупает</div><div>Банк продаёт</div>${dated ? "<div>Обновлено</div>" : ""}</div>` + rows.map((r) => `<div class="${cls}">
        <a class="tbl-bank" href="#/bank/${r.bankId}">${bankLogo(r.bankId, "sm")}<span>${esc(r.bank)}</span></a>
        <div><span class="v num${best.dearest && r.buy === best.dearest.buy ? " top-v" : ""}">${r.buy ? fmt(r.buy) : "—"}</span></div>
        <div><span class="v num${best.cheapest && r.sell === best.cheapest.sell ? " top-v" : ""}">${r.sell ? fmt(r.sell) : "—"}</span></div>
        ${dated ? `<div class="cap num">${esc(r.updated || "")}</div>` : ""}
      </div>`).join("") : `<div class="empty"><b>Банки не публикуют такой курс</b><span class="muted small">Выберите другой способ обмена</span></div>`;
    paintConv(best);
  }
  function paintConv(best = fxBest(cur, channel)) {
    const out = $("#conv-out", root), b = mode === "buy" ? best.cheapest : best.dearest, rate = b ? (mode === "buy" ? b.sell : b.buy) : null;
    if (!amount || !rate) { out.innerHTML = `<div class="k cap">${mode === "buy" ? "Заплатите" : "Получите"}</div><div style="margin-top:8px"><span class="slot">${rate ? "Введите сумму" : "Нет данных"}</span></div>`; return; }
    out.innerHTML = `<div class="k cap">${mode === "buy" ? "Заплатите" : "Получите"}</div><div class="v num">${fmt(amount * rate)} сум</div><div class="cap" style="margin-top:4px">${esc(b.bank)} · курс ${fmt(rate)}</div>`;
  }
  moneyInput($("#conv", root), (n) => { amount = n; paintConv(); });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.ch) { channel = b.dataset.ch; $$("[data-ch]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paint(); }
    else if (b?.dataset.mode) { mode = b.dataset.mode; $$("[data-mode]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintConv(); }
  });
  bindChart($("#chart", root), series(cur), cbu, fmt2);
  paint();
}

/** Курс ЦБ за последние 30 дней: [{ d: "ГГГГ-ММ-ДД", v }] */
const series = (cur) => db.history.slice(-30).map((x) => ({ d: x.d, v: x.cbu?.[cur] })).filter((p) => p.v > 0);
