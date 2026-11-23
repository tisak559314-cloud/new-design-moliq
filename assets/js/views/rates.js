// Курсы валют: курс ЦБ, где купить дешевле и продать дороже, все банки.
import { $, $$, esc, flag, fmt, fmt2, moneyInput, CUR } from "../lib.js";
import { db, fxRows, fxBest, fxDelta } from "../data.js";
import { bankLogo, dateRu } from "../app.js";

const NAMES = { USD: "Доллар США", EUR: "Евро", RUB: "Российский рубль" };
const CHANNELS = [["any", "Все"], ["bank", "В отделении"], ["app", "В приложении"], ["atm", "В банкомате"]];

export default async function rates(root, { path }) {
  const cur = NAMES[path[1]] ? path[1] : "USD";
  let channel = "any", mode = "buy", amount = null;
  // способы обмена — только те, по которым в данных есть курсы; один способ — переключатель не нужен
  const present = new Set(db.rates.rows.flatMap((r) => Object.values(r.rates || {}).flatMap((x) => Object.keys(x || {}))));
  const channels = CHANNELS.filter(([id]) => id === "any" || present.has(id));
  const cbu = db.rates.cbu[cur], d = fxDelta(cur);
  const delta = d === 0 ? `<span class="delta flat">без изменений</span>` : `<span class="delta ${d > 0 ? "up" : "down"} num">${d > 0 ? "▲" : "▼"} ${fmt2(Math.abs(d))} за день</span>`;

  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Курсы валют</h1>
      <div class="seg" role="navigation" aria-label="Валюта">${Object.keys(NAMES).map((c) => `<a href="#/rates/${c}"${c === cur ? ' aria-current="page"' : ""}>${flag(c)}${c}</a>`).join("")}</div>
    </div>
    <div class="rates-top">
      <div class="card rate-hero">
        <div><div class="fx-top">${flag(cur)}<b>${NAMES[cur]}</b>${delta}</div>
          <div class="fx-rate num">${fmt2(cbu)}<small>сум · курс ЦБ на ${esc(dateRu(db.rates.cbuDate))}</small></div></div>
        ${chart(cur)}
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
  bindChart($("#chart", root), series(cur), cbu);
  paint();
}

/** Курс ЦБ за последние 30 дней: [{ d: "ГГГГ-ММ-ДД", v }] */
const series = (cur) => db.history.slice(-30).map((x) => ({ d: x.d, v: x.cbu?.[cur] })).filter((p) => p.v > 0);
const CH = { W: 600, H: 120, pad: 6 };
/** Положение точки на графике в долях ширины и высоты */
function scale(pts) {
  const vals = pts.map((p) => p.v), min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  return { min, max, x: (i) => i / (pts.length - 1), y: (v) => (CH.pad + (1 - (v - min) / span) * (CH.H - CH.pad * 2)) / CH.H };
}

function chart(cur) {
  const pts = series(cur);
  if (pts.length < 2) return "";
  const { W, H } = CH, sc = scale(pts);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${(sc.x(i) * W).toFixed(1)} ${(sc.y(p.v) * H).toFixed(1)}`).join(" ");
  return `<figure>
    <div class="chart-box" id="chart" tabindex="0" role="group" aria-label="Курс ЦБ за 30 дней: от ${fmt2(sc.min)} до ${fmt2(sc.max)}">
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${line} L${W} ${H} L0 ${H} Z"/><path class="l" d="${line}" vector-effect="non-scaling-stroke"/></svg>
      <i class="chart-line" hidden></i><i class="chart-dot" hidden></i>
      <div class="chart-tip" role="status" hidden></div>
    </div>
    <figcaption class="cap num" style="display:flex;justify-content:space-between;margin-top:6px"><span>30 дней</span><span>${fmt2(sc.min)} – ${fmt2(sc.max)}</span></figcaption></figure>`;
}

/**
 * График отвечает на курсор, палец и стрелки клавиатуры: показывает дату, курс в этот день
 * и на сколько он выше или ниже сегодняшнего (today).
 */
function bindChart(box, pts, today) {
  if (!box || pts.length < 2) return;
  const line = $(".chart-line", box), dot = $(".chart-dot", box), tip = $(".chart-tip", box), sc = scale(pts);
  let at = -1;
  const hide = () => { at = -1; line.hidden = dot.hidden = tip.hidden = true; };
  const show = (i) => {
    i = Math.max(0, Math.min(pts.length - 1, i));
    if (i === at) return;
    at = i;
    const p = pts[i], x = sc.x(i) * 100, y = sc.y(p.v) * 100, diff = p.v - today;
    const delta = Math.abs(diff) < 0.005 ? `<span class="delta flat">как сегодня</span>`
      : `<span class="delta ${diff > 0 ? "up" : "down"}"><span class="num">${diff > 0 ? "▲" : "▼"} ${fmt2(Math.abs(diff))}</span><span>${diff > 0 ? "выше, чем сегодня" : "ниже, чем сегодня"}</span></span>`;
    tip.innerHTML = `<span class="cap num">${esc(dateRu(p.d))}</span><b class="num">${fmt2(p.v)} сум</b>${delta}`;
    line.hidden = dot.hidden = tip.hidden = false;
    line.style.left = dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    // подсказка — над точкой и не вылезает за края графика
    const half = tip.offsetWidth / 2, w = box.clientWidth, px = (x / 100) * w;
    tip.style.left = `${Math.max(half, Math.min(w - half, px))}px`;
    tip.style.top = `${(y / 100) * box.clientHeight}px`;
  };
  const point = (e) => { const r = box.getBoundingClientRect(); show(Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1))); };
  box.addEventListener("pointermove", point);
  box.addEventListener("pointerdown", point);
  // мышь ушла — убираем; после касания пальцем подсказка остаётся, пока не коснутся в другом месте
  box.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
  box.addEventListener("blur", hide);
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); show((at < 0 ? pts.length - 1 : at) + (e.key === "ArrowLeft" ? -1 : 1)); }
    else if (e.key === "Escape") hide();
  });
}
