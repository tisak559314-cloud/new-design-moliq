// AI-чат. В макете отвечает встроенный помощник по данным каталога; на сайте здесь будет модель Moliq AI.
import { $, $$, esc, icon, fmt, fmt2, short, pct, term, plural, annuity, moneyInput } from "../lib.js";
import { db, fxBest, bankName, LOAN_TYPES } from "../data.js";
import { store, save } from "../store.js";
import { bankLogo, rateRange } from "../app.js";

const STARTERS = ["Хочу получить кредит", "Где выгоднее купить доллары", "Какой вклад самый выгодный", "Где ближайший банкомат"];
const TERMS = { micro: [6, 12, 24, 36], consumer: [12, 24, 36, 60], auto: [12, 24, 36, 60], mortgage: [60, 120, 180, 240], edu: [12, 36, 60, 120] };

export default async function chat(root, { query }) {
  root.innerHTML = `<div class="chat">
    <div class="chat-log" id="log" aria-live="polite">
      <div class="chat-hello"><h1>Чем помочь?</h1><div class="chips">${STARTERS.map((q) => `<button class="chip" data-q="${esc(q)}">${q}</button>`).join("")}</div></div>
    </div>
    <div class="chat-box">
      <form class="ask-form" id="say"><input name="q" placeholder="Спросите про кредит, вклад, курс или банкомат" aria-label="Сообщение" autocomplete="off"><button class="btn btn-primary" aria-label="Отправить">${icon("send")}</button></form>
      <p class="cap">Отвечает по данным Bank.uz и ЦБ. Решение о кредите принимает банк.</p>
    </div>
  </div>`;
  const log = $("#log", root);
  const add = (who, html, wide = false) => { $(".chat-hello", log)?.remove(); log.insertAdjacentHTML("beforeend", `<div class="msg ${who}${wide ? " wide" : ""}">${html}</div>`); log.scrollTop = log.scrollHeight; return log.lastElementChild; };

  function ask(q) {
    add("me", esc(q));
    setTimeout(() => answer(q.toLowerCase()), 350);
  }
  function answer(q) {
    if (/кредит|займ|заём|ипотек|рассрочк|в долг/.test(q)) return loanForm(/ипотек/.test(q) ? "mortgage" : /авто|машин/.test(q) ? "auto" : /учёб|учеб|контракт|образов/.test(q) ? "edu" : "micro");
    if (/доллар|евро|рубл|курс|валют|usd|eur/.test(q)) {
      const cur = /евро|eur/.test(q) ? "EUR" : /рубл|rub/.test(q) ? "RUB" : "USD", b = fxBest(cur);
      return add("ai", `<p>Курс ЦБ — <b class="num">${fmt2(db.rates.cbu[cur])}</b> сум.</p>
        ${b.cheapest ? `<p>Дешевле всего купить в ${esc(b.cheapest.bank)} — <b class="num">${fmt(b.cheapest.sell)}</b> сум.</p>` : ""}
        ${b.dearest ? `<p>Дороже всего продать в ${esc(b.dearest.bank)} — <b class="num">${fmt(b.dearest.buy)}</b> сум.</p>` : ""}
        <div class="chips"><a class="chip chip-soft" href="#/rates/${cur}">Курсы всех банков</a></div>`);
    }
    if (/вклад|депозит|накоп/.test(q)) {
      const seen = new Set();
      const top = db.deposits.filter((d) => d.cur === "UZS" && d.rate != null && (!/пополн/.test(q) || d.topup)).sort((a, b) => b.rate - a.rate).filter((d) => (seen.has(d.bankId) ? false : seen.add(d.bankId))).slice(0, 3);
      add("ai", `Самые высокие ставки по вкладам в сумах${/пополн/.test(q) ? " с пополнением" : ""}:`);
      return add("ai", top.map((d) => mini(`#/deposits?open=${d.id}`, d, [["Ставка", pct(d.rate)], ["Срок", d.termHi ? term(d.termHi) : "Без срока"], ["От", d.min ? short(d.min) : "любой суммы"]])).join("") + `<div class="chips"><a class="chip chip-soft" href="#/deposits">Все вклады</a></div>`, true);
    }
    if (/банкомат|снять|налич|отделен/.test(q)) return add("ai", `Покажу банкоматы на карте — можно выбрать банк, карту и «Круглосуточно».<div class="chips"><a class="chip chip-soft" href="#/map">Открыть карту</a></div>`);
    if (/карт/.test(q)) return add("ai", `В каталоге ${db.cards.length} карт: Humo, Uzcard, Visa, Mastercard.<div class="chips"><a class="chip chip-soft" href="#/cards">Выбрать карту</a></div>`);
    return add("ai", `В макете я отвечаю на вопросы о кредитах, вкладах, курсах и банкоматах. На сайте здесь отвечает модель Moliq AI.<div class="chips">${STARTERS.slice(0, 3).map((s) => `<button class="chip chip-soft" data-q="${esc(s)}">${s}</button>`).join("")}</div>`);
  }

  // Подбор кредита прямо в чате: короткая анкета → три предложения
  function loanForm(type) {
    const st = { type, amount: store.loan.amount, term: store.loan.term };
    const el = add("ai", "", true);
    const paintForm = () => {
      el.innerHTML = `<div class="card" style="display:grid;gap:12px;padding:18px">
        <div class="chips" role="group" aria-label="Вид кредита">${LOAN_TYPES.map((t) => `<button class="chip chip-soft" data-ltype="${t.id}" aria-pressed="${t.id === st.type}">${t.name}</button>`).join("")}</div>
        <label class="field has-suffix"><span>Сколько вам нужно</span><input inputmode="numeric" placeholder="Например, 20 000 000" autocomplete="off"><i class="suffix">сум</i></label>
        <div class="chips" role="group" aria-label="Срок">${TERMS[st.type].map((m) => `<button class="chip chip-soft" data-lterm="${m}" aria-pressed="${st.term === m}">${term(m)}</button>`).join("")}</div>
        <button class="btn btn-primary" data-pick>Подобрать предложения</button>
      </div>`;
      moneyInput($("input", el), (n) => { st.amount = n; }).set(st.amount);
    };
    paintForm();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.ltype) { st.type = b.dataset.ltype; if (!TERMS[st.type].includes(st.term)) st.term = null; paintForm(); }
      else if (b.dataset.lterm) { st.term = Number(b.dataset.lterm); $$("[data-lterm]", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
      else if ("pick" in b.dataset) {
        if (!st.amount || !st.term) { $("input", el).focus(); return add("ai", `Укажите ${!st.amount ? "сумму" : "срок"} — и я подберу.`); }
        store.loan.amount = st.amount; store.loan.term = st.term; save();
        const name = LOAN_TYPES.find((t) => t.id === st.type).name;
        el.remove();
        add("me", `${name} · ${short(st.amount)} · ${term(st.term)}`);
        setTimeout(() => offers(st), 350);
      }
    });
  }
  function offers({ type, amount, term: months }) {
    const seen = new Set();
    const list = db.loans.filter((l) => l.type === type && !l.targeted && l.rateHi > 0 && (l.min == null || amount >= l.min) && (l.max == null || amount <= l.max) && (l.termLo == null || months >= l.termLo) && (l.termHi == null || months <= l.termHi)).sort((a, b) => a.rateHi - b.rateHi);
    const top = list.filter((l) => (seen.has(l.bankId) ? false : seen.add(l.bankId))).slice(0, 3);
    if (!top.length) return add("ai", `На ${short(amount)} на ${term(months)} предложений нет. Попробуйте другой срок или сумму.<div class="chips"><a class="chip chip-soft" href="#/credits/${type}">Все предложения</a></div>`);
    add("ai", `Нашёл ${list.length} ${plural(list.length, ["предложение", "предложения", "предложений"])}. Три с самой низкой ставкой:`);
    add("ai", top.map((l) => { const pay = annuity(amount, l.rateHi, months); return mini(`#/credits/${type}?open=${l.id}`, l, [["Ставка", rateRange(l)], ["Платёж", `${fmt(pay)}`], ["Переплата", `${short(pay * months - amount)}`]]); }).join("")
      + `<div class="chips"><a class="chip chip-soft" href="#/credits/${type}">Все ${list.length}</a><a class="chip chip-soft" href="#/check">Проверить, по силам ли</a></div>
      <p class="cap">Платёж и переплата — по верхней границе ставки. Целевые программы в подбор не входят.</p>`, true);
  }
  const mini = (href, x, pairs) => `<a class="mini-offer" href="${href}"><div class="offer-id">${bankLogo(x.bankId, "sm")}<div><div class="offer-bank">${esc(bankName(x.bankId))}</div><b>${esc(x.name)}</b></div></div>${pairs.map(([k, v]) => `<div class="kv"><div class="k">${k}</div><div class="v num">${esc(v)}</div></div>`).join("")}</a>`;

  root.addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) ask(b.dataset.q); });
  $("#say", root).addEventListener("submit", (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (!q) return; e.target.q.value = ""; ask(q); });
  const first = query.get("q");
  if (first) ask(first); else $("#say input", root).focus({ preventScroll: true });
}
