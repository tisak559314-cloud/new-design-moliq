// «Что мне по силам»: доход, сумма и срок → платёж, нагрузка и понятный вывод. Один экран, без шагов.
import { $, $$, icon, fmt, short, pct, term, plural, annuity, principal, median, moneyInput } from "../lib.js";
import { db, LOAN_TYPES } from "../data.js";
import { store, save } from "../store.js";

const TERMS = { micro: [6, 12, 24, 36], consumer: [12, 24, 36, 48, 60], auto: [12, 24, 36, 48, 60], mortgage: [60, 120, 180, 240], edu: [12, 36, 60, 120] };
const SUMS = { micro: [5e6, 10e6, 20e6, 50e6], consumer: [10e6, 20e6, 50e6, 100e6], auto: [50e6, 100e6, 200e6, 300e6], mortgage: [200e6, 400e6, 600e6, 800e6], edu: [10e6, 20e6, 50e6, 100e6] };
const CALM = 0.35, LIMIT = 0.5; // до 35% дохода — спокойно; больше половины банки не дают

export default async function check(root) {
  const s = { type: "micro", income: null, other: null };
  // срок мог прийти из другого раздела (ипотека на 20 лет) — для микрозайма он не годится
  if (store.loan.term && store.loan.term > Math.max(...TERMS[s.type])) { store.loan.term = null; save(); }
  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Что мне по силам</h1></div>
    <div class="check">
      <div class="card check-form">
        <div class="chips" role="group" aria-label="Вид кредита" id="types">${LOAN_TYPES.map((t) => `<button class="chip chip-soft" data-type="${t.id}" aria-pressed="${t.id === s.type}">${t.name}</button>`).join("")}</div>
        <label class="field has-suffix"><span>Доход в месяц</span><input id="income" inputmode="numeric" placeholder="Например, 8 000 000" autocomplete="off"><i class="suffix">сум</i></label>
        <label class="field has-suffix"><span>Платежи по другим кредитам в месяц</span><input id="other" inputmode="numeric" placeholder="Нет кредитов — оставьте пустым" autocomplete="off"><i class="suffix">сум</i></label>
        <label class="field has-suffix"><span>Сколько хотите взять</span><input id="amount" inputmode="numeric" autocomplete="off"><i class="suffix">сум</i></label>
        <div class="chips" role="group" aria-label="Готовые суммы" id="sums"></div>
        <div><div class="cap" style="margin-bottom:8px">Срок</div><div class="chips" role="group" aria-label="Срок" id="terms"></div></div>
      </div>
      <div class="card verdict" id="out" aria-live="polite"></div>
    </div>
  </div>`;

  const amountCtl = moneyInput($("#amount", root), (n) => { store.loan.amount = n; save(); paintPresets(); paint(); });
  moneyInput($("#income", root), (n) => { s.income = n; paint(); });
  moneyInput($("#other", root), (n) => { s.other = n; paint(); });
  amountCtl.set(store.loan.amount);

  function paintPresets() {
    const terms = [...new Set([...TERMS[s.type], ...(store.loan.term ? [store.loan.term] : [])])].sort((a, b) => a - b);
    $("#sums", root).innerHTML = SUMS[s.type].map((v) => `<button class="chip chip-soft" data-amount="${v}" aria-pressed="${store.loan.amount === v}">${short(v)}</button>`).join("");
    $("#terms", root).innerHTML = terms.map((m) => `<button class="chip chip-soft" data-term="${m}" aria-pressed="${store.loan.term === m}">${term(m)}</button>`).join("");
    $("#amount", root).placeholder = `Например, ${fmt(SUMS[s.type][1])}`;
  }

  function paint() {
    const out = $("#out", root), { amount, term: months } = store.loan, { income } = s, other = s.other || 0;
    const pool = db.loans.filter((l) => l.type === s.type && !l.targeted && l.rateHi > 0);
    const rate = median(pool.map((l) => l.rateHi));
    if (!income || !amount || !months) {
      const need = [!income && "доход", !amount && "сумму", !months && "срок"].filter(Boolean).join(", ");
      out.className = "card verdict";
      out.innerHTML = `<div class="verdict-t" style="color:var(--ink-3)">Здесь появится ответ</div><div><span class="slot">Укажите ${need}</span></div>
        <p class="cap">Считаем по типичной ставке банков. На все кредиты — не больше половины дохода: так банкам велит ЦБ.</p>`;
      return;
    }
    const pay = annuity(amount, rate, months), load = (other + pay) / income, room = income * LIMIT - other;
    const state = load <= CALM ? "ok" : load <= LIMIT ? "warn" : "bad";
    const title = { ok: "По силам", warn: "По силам, но впритык", bad: "Тяжело: банк, скорее всего, откажет" }[state];
    const fitsOffers = pool.filter((l) => (l.min == null || amount >= l.min) && (l.max == null || amount <= l.max) && (l.termLo == null || months >= l.termLo) && (l.termHi == null || months <= l.termHi)).length;

    // совет обязан приводить к «по силам»: считаем срок и сумму, при которых нагрузка проходит
    let advice = "";
    if (state !== "ok") {
      const target = state === "bad" ? LIMIT : CALM, payRoom = income * target - other, tips = [];
      const longer = TERMS[s.type].find((m) => m > months && (other + annuity(amount, rate, m)) / income <= target);
      if (longer) tips.push(`<button class="chip" data-term="${longer}">Срок ${term(longer)}</button>`);
      const lessRaw = Math.floor(principal(payRoom, rate, months) / 1e5) * 1e5;
      if (lessRaw >= 1e6) tips.push(`<button class="chip" data-amount="${lessRaw}">Сумма ${short(lessRaw)}</button>`);
      advice = tips.length
        ? `<div class="advice"><b>${state === "bad" ? "Так пройдёт" : "Так будет спокойнее"}</b><div class="chips">${tips.join("")}</div></div>`
        : state === "bad" ? `<div class="advice"><b>При таком доходе новый кредит не пройдёт</b><span class="small muted">Сначала закройте часть текущих платежей.</span></div>` : "";
    }
    out.className = `card verdict ${state}`;
    out.innerHTML = `<div class="verdict-t">${title}</div>
      <div><div class="meter" role="img" aria-label="На кредиты уйдёт ${Math.round(load * 100)}% дохода"><i style="left:${Math.min(100, load * 100)}%"></i></div>
        <div class="meter-scale num"><span style="left:0">0%</span><span style="left:35%">35%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></div></div>
      <div class="lines num">
        <div><span>Доход в месяц</span><span>${fmt(income)} сум</span></div>
        ${other ? `<div><span>Платежи по другим кредитам</span><span>− ${fmt(other)} сум</span></div>` : ""}
        <div><span>Платёж за ${short(amount)} на ${term(months)}</span><span>− ${fmt(pay)} сум</span></div>
        <div><span>Останется на жизнь</span><span>${fmt(income - other - pay)} сум</span></div>
      </div>
      ${advice}
      ${room > 0 ? `<p class="cap">Платёж посчитан по типичной ставке ${pct(rate)}. На все кредиты банки дают не больше половины дохода — у вас это ${fmt(income * LIMIT)} сум в месяц.</p>` : ""}
      ${state !== "bad" && fitsOffers ? `<a class="btn btn-primary" href="#/credits/${s.type}">Показать ${fitsOffers} ${plural(fitsOffers, ["предложение", "предложения", "предложений"])} ${icon("arrow")}</a>` : ""}`;
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.type) { s.type = b.dataset.type; $$("[data-type]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (store.loan.term && store.loan.term > Math.max(...TERMS[s.type])) store.loan.term = null; }
    else if (b.dataset.amount) { store.loan.amount = Number(b.dataset.amount); amountCtl.set(store.loan.amount); }
    else if (b.dataset.term) { store.loan.term = Number(b.dataset.term); }
    else return;
    save(); paintPresets(); paint();
  });
  paintPresets(); paint();
}
