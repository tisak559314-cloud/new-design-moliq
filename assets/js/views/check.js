// «Что мне по силам». Ответ появляется сразу после дохода и меняется при каждом нажатии:
// суммы набираются кнопками «−» / «+» и добавками («+1 млн»), печатать не обязательно.
import { $, $$, icon, fmt, short, pct, term, plural, annuity, principal, median, moneyInput } from "../lib.js";
import { db, LOAN_TYPES } from "../data.js";
import { store, save } from "../store.js";

const TERMS = { micro: [6, 12, 24, 36], consumer: [12, 24, 36, 48, 60], auto: [12, 24, 36, 48, 60], mortgage: [60, 120, 180, 240], edu: [12, 36, 60, 120] };
// добавки к сумме кредита — по масштабу вида кредита
const ADD_SUM = { micro: [1e6, 5e6, 10e6], consumer: [1e6, 5e6, 10e6], auto: [10e6, 50e6, 100e6], mortgage: [50e6, 100e6, 200e6], edu: [1e6, 5e6, 10e6] };
const ADD_PAY = [5e5, 1e6, 5e6];
const CALM = 0.35, LIMIT = 0.5; // до 35% дохода — спокойно; больше половины банки не дают
const STATE = { ok: "По силам", warn: "Впритык", bad: "Тяжело" };

/** Шаг кнопок «−» / «+»: растёт вместе с числом */
const stepOf = (key, v) => (key === "amount" ? (v < 20e6 ? 1e6 : v < 100e6 ? 5e6 : 10e6) : v < 10e6 ? 5e5 : 1e6);

export default async function check(root, { query }) {
  const c = store.check;
  // расчёт можно передать ссылкой: #/check?type=micro&income=8000000&other=1000000&amount=20000000&term=24
  const num = (k) => { const v = Number(query.get(k)); return v > 0 ? v : null; };
  if (query.get("type")) c.type = query.get("type");
  if (num("income")) c.income = num("income");
  if (num("other")) { c.other = num("other"); c.has = true; }
  if (num("amount")) store.loan.amount = num("amount");
  if (num("term")) store.loan.term = num("term");
  let type = LOAN_TYPES.some((t) => t.id === c.type) ? c.type : "micro";
  // срок мог прийти из другого раздела (ипотека на 20 лет) — для микрозайма он не годится
  const fixTerm = () => { if (store.loan.term && !TERMS[type].includes(store.loan.term)) store.loan.term = null; };
  fixTerm();

  const get = (key) => (key === "amount" ? store.loan.amount : c[key]) || 0;
  const field = (key, label, hint, adds) => `<div class="stp">
      <button class="stp-b" data-step="-1" data-key="${key}" aria-label="Уменьшить">${icon("minus")}</button>
      <label class="field has-suffix"><span>${label}<em>, сум</em></span><input id="f-${key}" inputmode="numeric" placeholder="${hint}" autocomplete="off"><i class="suffix">сум</i>
        <button type="button" class="fld-x" data-clear="${key}" aria-label="Очистить" hidden>${icon("x", "ic-s")}</button></label>
      <button class="stp-b" data-step="1" data-key="${key}" aria-label="Увеличить">${icon("plus")}</button>
    </div>
    <div class="chips adds" id="adds-${key}">${adds.map((v) => `<button class="chip chip-soft" data-add="${v}" data-key="${key}">+${short(v)}</button>`).join("")}</div>`;

  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Что мне по силам</h1></div>
    <div class="check">
      <div class="card check-form">
        <section class="q" id="q-type">
          <h2 class="q-t"><i>1</i>Какой кредит</h2>
          <div class="chips" role="group" aria-label="Вид кредита">${LOAN_TYPES.map((t) => `<button class="chip chip-soft" data-type="${t.id}" aria-pressed="${t.id === type}">${t.name}</button>`).join("")}</div>
        </section>
        <section class="q" id="q-income">
          <h2 class="q-t"><i>2</i>Ваш доход в месяц</h2>
          ${field("income", "Доход в месяц", "8 000 000", ADD_PAY)}
        </section>
        <section class="q" id="q-other">
          <h2 class="q-t"><i>3</i>Другие кредиты</h2>
          <div class="seg" role="group" aria-label="Есть ли другие кредиты"><button data-has="0" aria-pressed="${!c.has}">Нет</button><button data-has="1" aria-pressed="${!!c.has}">Есть</button></div>
          <div id="other-box"${c.has ? "" : " hidden"} style="margin-top:12px">${field("other", "Плачу по ним в месяц", "1 000 000", ADD_PAY.slice(0, 2))}</div>
        </section>
        <section class="q" id="q-loan">
          <h2 class="q-t"><i>4</i>Сумма и срок</h2>
          <div id="amount-box"></div>
          <div class="cap" style="margin:14px 0 8px">Срок</div>
          <div class="chips" role="group" aria-label="Срок" id="terms"></div>
        </section>
      </div>
      <div class="card verdict" id="out" aria-live="polite"></div>
    </div>
    <button class="peek" id="peek" hidden></button>
  </div>`;

  // ── Поля ──
  const ctl = {};
  const bind = (key) => { ctl[key] = moneyInput($(`#f-${key}`, root), (n) => write(key, n, false)); ctl[key].set(get(key) || null); };
  function write(key, value, repaintInput = true) {
    const v = value && value > 0 ? Math.round(value) : null;
    if (key === "amount") store.loan.amount = v; else c[key] = v;
    save();
    if (repaintInput) {
      ctl[key].set(v);
      const el = $(`#f-${key}`, root).closest(".field");
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); // короткий отклик на нажатие
    }
    paint();
  }
  const stepBy = (key, dir) => { const v = get(key); write(key, dir > 0 ? v + stepOf(key, v) : v - stepOf(key, Math.max(0, v - 1))); };
  function paintLoanBox() {
    $("#amount-box", root).innerHTML = field("amount", "Сколько хотите взять", "По желанию", ADD_SUM[type]);
    bind("amount");
    $("#terms", root).innerHTML = TERMS[type].map((m) => `<button class="chip chip-soft" data-term="${m}" aria-pressed="${store.loan.term === m}">${term(m)}</button>`).join("");
  }
  bind("income"); bind("other"); paintLoanBox();

  // ── Ответ ──
  let lastLoad = null;
  function paint() {
    const out = $("#out", root), income = c.income || 0, other = c.has ? c.other || 0 : 0, { amount, term: months } = store.loan;
    const pool = db.loans.filter((l) => l.type === type && !l.targeted && l.rateHi > 0);
    const rate = median(pool.map((l) => l.rateHi)), poolMax = Math.max(0, ...pool.map((l) => l.max || 0)) || Infinity;
    // сумма, которую тянет платёж pay на срок m: вниз до 100 тыс., меньше 500 тыс. — уже не кредит
    const cap = (pay, m) => { const p = Math.floor(Math.min(principal(pay, rate, m), poolMax) / 1e5) * 1e5; return p >= 5e5 ? p : 0; };
    const stateOf = (load) => (load <= CALM ? "ok" : load <= LIMIT ? "warn" : "bad");
    const note = `<p class="cap">Считаем по типичной ставке ${pct(rate)}. Спокойно — когда на все кредиты уходит до 35% дохода; больше половины банки не дают.</p>`;
    // отметки шагов: сделано — лаймовая
    $("#q-type", root).classList.add("done");
    $("#q-income", root).classList.toggle("done", income > 0);
    $("#q-other", root).classList.toggle("done", income > 0 && (!c.has || other > 0));
    for (const key of ["income", "other", "amount"]) {
      const empty = !get(key);
      $(`[data-step="-1"][data-key="${key}"]`, root).disabled = empty;
      $(`[data-clear="${key}"]`, root).hidden = empty;
    }
    $("#q-loan", root).classList.toggle("done", !!(amount && months));
    $$("[data-term]", root).forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.term) === months)));
    let peek = "";
    if (!(income && amount && months)) lastLoad = null;

    if (!income) {
      out.className = "card verdict";
      out.innerHTML = `<div class="verdict-t muted">Укажите доход</div><p class="muted">Сразу покажем, какая сумма вам по силам.</p>
        <div class="chips">${[3e6, 5e6, 8e6, 12e6].map((v) => `<button class="chip" data-set="${v}" data-key="income">${short(v)}</button>`).join("")}</div>`;
    } else if (!amount) {
      // доход есть, суммы нет: главный ответ страницы — сколько по силам на каждый срок
      const rows = TERMS[type].map((m) => ({ m, calm: cap(income * CALM - other, m), top: cap(income * LIMIT - other, m) }));
      const tight = rows.every((r) => !r.calm), none = rows.every((r) => !r.top);
      if (none) {
        out.className = "card verdict bad";
        out.innerHTML = `<div class="verdict-t">Новый кредит сейчас не по силам</div><p class="muted">${other ? `Другие кредиты уже забирают ${Math.round((other / income) * 100)}% дохода.` : "Дохода не хватает даже на самый маленький платёж."}</p>${note}`;
        peek = "Не по силам";
      } else {
        const best = rows[rows.length - 1];
        out.className = `card verdict ${tight ? "warn" : "ok"}`;
        out.innerHTML = `<div><div class="verdict-t">${tight ? "По силам только впритык" : "Вам по силам"}</div><p class="muted" style="margin-top:6px">Нажмите на срок — проверим эту сумму.</p></div>
          <div class="rows">${rows.map((r) => { const sum = tight ? r.top : r.calm; return sum ? `<button class="row-b" data-row-term="${r.m}" data-row-amount="${sum}" aria-pressed="${months === r.m}">
            <span>${term(r.m)}</span><b class="num">до ${short(sum)}</b><span class="cap num">платёж ${fmt(annuity(sum, rate, r.m))} сум</span></button>` : ""; }).join("")}</div>${note}`;
        peek = `По силам до ${short(tight ? best.top : best.calm)}`;
      }
    } else if (!months) {
      // сумма есть, срока нет: показываем, как она ложится на каждый срок
      out.className = "card verdict";
      out.innerHTML = `<div><div class="verdict-t">${short(amount)}: выберите срок</div></div>
        <div class="rows">${TERMS[type].map((m) => { const pay = annuity(amount, rate, m), st = stateOf((other + pay) / income); return `<button class="row-b" data-row-term="${m}">
          <span>${term(m)}</span><b class="num">${fmt(pay)} сум в месяц</b><span class="st ${st}">${STATE[st]}</span></button>`; }).join("")}</div>${note}`;
      peek = "Выберите срок";
    } else {
      const pay = annuity(amount, rate, months), load = (other + pay) / income, state = stateOf(load);
      const title = { ok: "По силам", warn: "По силам, но впритык", bad: "Тяжело: банк, скорее всего, откажет" }[state];
      const fitsOffers = pool.filter((l) => (l.min == null || amount >= l.min) && (l.max == null || amount <= l.max) && (l.termLo == null || months >= l.termLo) && (l.termHi == null || months <= l.termHi)).length;
      // совет обязан приводить к «по силам»: срок и сумма, при которых нагрузка проходит
      let advice = "";
      if (state !== "ok") {
        const target = state === "bad" ? LIMIT : CALM, tips = [];
        const longer = TERMS[type].find((m) => m > months && (other + annuity(amount, rate, m)) / income <= target);
        if (longer) tips.push(`<button class="chip" data-term="${longer}">Срок ${term(longer)}</button>`);
        const less = cap(income * target - other, months);
        if (less && less < amount) tips.push(`<button class="chip" data-set="${less}" data-key="amount">Сумма ${short(less)}</button>`);
        advice = tips.length ? `<div class="advice"><b>${state === "bad" ? "Так пройдёт" : "Так будет спокойнее"}</b><div class="chips">${tips.join("")}</div></div>`
          : state === "bad" ? `<div class="advice"><b>При таком доходе новый кредит не пройдёт</b><span class="small muted">Сначала закройте часть текущих платежей.</span></div>` : "";
      } else {
        const room = cap(income * CALM - other, months);
        if (room > amount) advice = `<p class="cap">На этот срок спокойно — до ${short(room)}.</p>`;
      }
      out.className = `card verdict ${state}`;
      out.innerHTML = `<div class="verdict-t">${title}</div>
        <div><div class="meter" role="img" aria-label="На кредиты уйдёт ${Math.round(load * 100)}% дохода"><i id="mark" style="left:${lastLoad ?? Math.min(100, load * 100)}%"></i></div>
          <div class="meter-scale num"><span style="left:0">0%</span><span style="left:35%">35%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></div></div>
        <div class="lines num">
          <div><span>Доход в месяц</span><span>${fmt(income)} сум</span></div>
          ${other ? `<div><span>Платежи по другим кредитам</span><span>− ${fmt(other)} сум</span></div>` : ""}
          <div><span>Платёж за ${short(amount)} на ${term(months)}</span><span>− ${fmt(pay)} сум</span></div>
          <div><span>Останется на жизнь</span><span>${fmt(income - other - pay)} сум</span></div>
        </div>
        ${advice}
        ${state !== "bad" && fitsOffers ? `<a class="btn btn-primary" href="#/credits/${type}">Показать ${fitsOffers} ${plural(fitsOffers, ["предложение", "предложения", "предложений"])} ${icon("arrow")}</a>` : ""}
        ${note}`;
      const at = Math.min(100, load * 100);
      if (lastLoad != null && lastLoad !== at) setTimeout(() => { const mk = $("#mark", root); if (mk) mk.style.left = `${at}%`; }, 30);
      lastLoad = at;
      peek = `${STATE[state]} · платёж ${short(Math.round(pay / 1e4) * 1e4)}`;
    }
    // на телефоне ответ ниже полей — короткая строка с ним держится над панелью разделов
    const p = $("#peek", root);
    p.textContent = peek;
    p.className = `peek ${out.classList.contains("bad") ? "bad" : out.classList.contains("warn") ? "warn" : out.classList.contains("ok") ? "ok" : ""}`;
    p.dataset.show = peek ? "1" : "";
    syncPeek();
  }

  // строка-ответ видна, только пока сама карточка ответа за экраном
  let outSeen = false;
  const syncPeek = () => { const p = $("#peek", root); p.hidden = !p.dataset.show || outSeen; };
  const io = new IntersectionObserver((es) => { outSeen = es[0].isIntersecting; syncPeek(); }, { threshold: 0.15 });
  io.observe($("#out", root));

  // ── События ──
  let hold = null;
  const stopHold = () => { clearTimeout(hold); clearInterval(hold); hold = null; };
  root.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".stp-b");
    if (!b) return;
    const key = b.dataset.key, dir = Number(b.dataset.step);
    stepBy(key, dir);
    stopHold();
    // удержание — число бежит само
    hold = setTimeout(() => { hold = setInterval(() => stepBy(key, dir), 90); }, 420);
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) root.addEventListener(ev, stopHold, true);
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (b.classList.contains("stp-b")) { if (e.detail === 0) stepBy(d.key, Number(d.step)); return; } // с клавиатуры; мышь и палец — в pointerdown
    if (d.clear) { write(d.clear, null); return $(`#f-${d.clear}`, root).focus({ preventScroll: true }); }
    if (d.add) return write(d.key, get(d.key) + Number(d.add));
    if (d.set) return write(d.key, Number(d.set));
    if (d.type) { type = c.type = d.type; fixTerm(); save(); $$("[data-type]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintLoanBox(); return paint(); }
    if (d.has) { c.has = d.has === "1"; save(); $$("[data-has]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#other-box", root).hidden = !c.has; if (c.has) $("#f-other", root).focus({ preventScroll: true }); return paint(); }
    if (d.rowTerm) { store.loan.term = Number(d.rowTerm); if (d.rowAmount) { store.loan.amount = Number(d.rowAmount); ctl.amount.set(store.loan.amount); } save(); return paint(); }
    if (d.term) { const m = Number(d.term); store.loan.term = store.loan.term === m && !b.closest("#out") ? null : m; save(); return paint(); }
    if (b.id === "peek") $("#out", root).scrollIntoView({ behavior: "smooth", block: "start" });
  });

  paint();
  return () => { stopHold(); io.disconnect(); };
}
