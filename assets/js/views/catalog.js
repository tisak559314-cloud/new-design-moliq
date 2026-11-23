// Каталог: кредиты, вклады, карты. Одна строка — одно предложение, сверху сумма и срок.
import { $, $$, esc, safeUrl, icon, fmt, short, pct, term, plural, annuity, money, moneyInput, CUR } from "../lib.js";
import { db, bankName, LOAN_TYPES } from "../data.js";
import { store, save } from "../store.js";
import { bankLogo, rateRange, toggleCompare, inCompare, dateRu } from "../app.js";

const PAGE = 12;
const LOAN_TERMS = { all: [6, 12, 24, 36, 60, 120, 240], micro: [6, 12, 24, 36], consumer: [12, 24, 36, 48, 60], auto: [12, 24, 36, 48, 60], mortgage: [60, 120, 180, 240], edu: [12, 36, 60, 120] };
const LOAN_SUMS = { all: [5e6, 10e6, 20e6, 50e6, 100e6], micro: [5e6, 10e6, 20e6, 50e6, 100e6], consumer: [10e6, 20e6, 50e6, 100e6], auto: [50e6, 100e6, 200e6, 300e6], mortgage: [200e6, 400e6, 600e6, 800e6], edu: [10e6, 20e6, 50e6, 100e6] };
const DEP_SUMS = { UZS: [5e6, 10e6, 50e6, 100e6], USD: [500, 1000, 5000, 10000], EUR: [500, 1000, 5000, 10000] };
const DEP_TERMS = [["any", "Любой срок"], ["6", "до 6 мес."], ["13", "до года"], ["25", "до 2 лет"], ["more", "дольше"]];
const SYS = ["Humo", "Uzcard", "Visa", "Mastercard", "UnionPay"];
const offersWord = (n) => `${n} ${plural(n, ["предложение", "предложения", "предложений"])}`;
const nullsLast = (get, dir = 1) => (a, b) => { const x = get(a), y = get(b); return x == null ? (y == null ? 0 : 1) : y == null ? -1 : (x - y) * dir; };

export default async function catalog(root, { section, path, query }) {
  const K = section;
  const type = K === "credits" && LOAN_TYPES.some((t) => t.id === path[1]) ? path[1] : "all";
  const f = { flags: new Set(), sys: new Set(), bank: query.get("bank") || "", sort: K === "deposits" ? "rate" : K === "cards" ? "issue" : "rate", termB: "any" };
  if (K === "deposits") {
    const cur = db.deposits.find((d) => d.id === Number(query.get("open")))?.cur || query.get("cur");
    if (["UZS", "USD", "EUR"].includes(cur)) { store.dep.cur = cur; save(); }
  }
  // сумму и срок можно передать ссылкой: #/credits/micro?amount=20000000&term=24
  const qAmount = Number(query.get("amount")), qTerm = Number(query.get("term"));
  if (qAmount > 0) { (K === "credits" ? store.loan : store.dep).amount = qAmount; save(); }
  if (qTerm > 0 && K === "credits") { store.loan.term = qTerm; save(); }
  let shown = PAGE, focusId = Number(query.get("open")) || null;
  // предложение, открытое по прямой ссылке (поиск, чат, «лучшие»), остаётся в списке при любых фильтрах
  const pinId = focusId;
  const openIds = new Set(focusId ? [focusId] : []), openBanks = new Set();
  // целевые программы (для бизнеса, молодёжи и т. п.) по умолчанию скрыты: они дешевле, но даются не всем
  if (K === "credits" && focusId && db.loans.find((l) => l.id === focusId)?.targeted) f.flags.add("targeted");

  // ── Что показываем ──
  const all = K === "credits" ? db.loans : K === "deposits" ? db.deposits : db.cards;
  const cmpKind = K === "credits" ? "loan" : K === "deposits" ? "deposit" : "card";
  function fits(x) {
    if (f.bank && x.bankId !== f.bank) return false;
    if (f.flags.has("online") && !x.online) return false;
    if (K === "credits") {
      if (type !== "all" && x.type !== type) return false;
      if (f.flags.has("nocol") && !x.noCollateral) return false;
      if (!f.flags.has("targeted") && x.targeted) return false;
      const a = store.loan.amount, m = store.loan.term;
      if (a && ((x.min != null && a < x.min) || (x.max != null && a > x.max))) return false;
      if (m && ((x.termLo != null && m < x.termLo) || (x.termHi != null && m > x.termHi))) return false;
    } else if (K === "deposits") {
      if (x.cur !== store.dep.cur) return false;
      for (const k of ["topup", "withdraw", "capitalization"]) if (f.flags.has(k) && !x[k]) return false;
      if (store.dep.amount && x.min != null && x.min > store.dep.amount) return false;
      if (f.termB !== "any") {
        const t = x.termHi;
        if (t == null) return false;
        if (f.termB === "more" ? t <= 25 : f.termB === "6" ? t > 6 : f.termB === "13" ? t <= 6 || t > 13 : t <= 13 || t > 25) return false;
      }
    } else {
      for (const s of f.sys) if (!x.systems.includes(s)) return false;
      if (f.flags.has("free") && x.issue !== 0) return false;
      if (f.flags.has("usd") && x.cur !== "USD") return false;
    }
    return true;
  }
  const SORTS = {
    credits: { rate: ["Сначала ниже ставка", nullsLast((l) => l.rateHi)], max: ["Сначала больше сумма", nullsLast((l) => l.max, -1)], term: ["Сначала дольше срок", nullsLast((l) => l.termHi, -1)] },
    deposits: { rate: ["Сначала выше ставка", nullsLast((d) => d.rate, -1)], min: ["Сначала меньше взнос", nullsLast((d) => d.min ?? 0)], term: ["Сначала короче срок", nullsLast((d) => d.termHi)] },
    cards: { issue: ["Сначала дешевле выпуск", nullsLast((c) => c.issue)], bank: ["По банкам", (a, b) => bankName(a.bankId).localeCompare(bankName(b.bankId), "ru")] },
  }[K];

  /** Группы по банкам: порядок задаёт лучшее предложение банка */
  function groups() {
    const list = all.filter((x) => x.id === pinId || fits(x)).sort(SORTS[f.sort][1]);
    const map = new Map();
    for (const x of list) { if (!map.has(x.bankId)) map.set(x.bankId, []); map.get(x.bankId).push(x); }
    return { total: list.length, groups: [...map.values()] };
  }

  // ── Колонки, метки, подробности ──
  function cols(x) {
    if (K === "credits") {
      const a = store.loan.amount, m = store.loan.term, range = x.rateLo !== x.rateHi;
      const rate = ["Ставка", x.rateLo == null ? "По запросу" : rateRange(x)];
      if (a && m && x.rateHi != null) {
        const pay = annuity(a, x.rateHi, m);
        return [rate, [range ? "Платёж до" : "Платёж в месяц", `${fmt(pay)} сум`], [range ? "Переплата до" : "Переплата", `${fmt(pay * m - a)} сум`]];
      }
      return [rate, ["Сумма", x.max ? `до ${short(x.max)}` : x.min ? `от ${short(x.min)}` : "—"], ["Срок", x.termHi ? (x.termLo === x.termHi ? term(x.termHi) : `до ${term(x.termHi)}`) : "—"]];
    }
    if (K === "deposits") {
      const a = store.dep.amount, months = x.termHi || 12, sym = CUR[x.cur];
      const rate = ["Ставка", x.rate == null ? "По запросу" : pct(x.rate)];
      const t = ["Срок", x.termHi ? term(x.termHi) : "Без срока"];
      if (a && x.rate != null) {
        const inc = x.capitalization ? a * (Math.pow(1 + x.rate / 1200, months) - 1) : (a * x.rate / 100) * (months / 12);
        return [rate, [`Доход за ${x.termHi ? term(months) : "год"}`, `${fmt(inc)} ${sym}`], t];
      }
      return [rate, ["Минимальная сумма", x.min ? money(x.min, x.cur) : "Любая"], t];
    }
    const free = (v, text) => (v === 0 ? "Бесплатно" : text && text !== "-" ? text : "—");
    return [["Система", x.systems.join(", ") || "—"], ["Выпуск", free(x.issue, x.issueText)], ["Обслуживание в год", free(x.yearly, x.yearlyText)]];
  }
  function tags(x, lead) {
    const t = [];
    if (lead) t.push(`<span class="tag tag-lime">${lead}</span>`);
    if (x.online) t.push(`<span class="tag">Онлайн</span>`);
    if (K === "credits") {
      if (x.noCollateral) t.push(`<span class="tag">Без залога</span>`);
      if (x.targeted) t.push(`<span class="tag">Целевая программа</span>`);
    } else if (K === "deposits") {
      if (x.topup) t.push(`<span class="tag">Пополнение</span>`);
      if (x.withdraw) t.push(`<span class="tag">Снятие</span>`);
      if (x.capitalization) t.push(`<span class="tag">Капитализация</span>`);
    } else if (x.cur !== "UZS") t.push(`<span class="tag">${esc(x.cur)}</span>`);
    return t.join("");
  }
  function details(x) {
    const fact = (k, v) => (v == null || v === "" ? "" : `<div class="kv"><div class="k">${k}</div><div class="v">${esc(v)}</div></div>`);
    const list = (title, items) => (items?.length ? `<div><h4>${title}</h4><ul>${items.slice(0, 6).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : "");
    let facts = "", lists = "";
    if (K === "credits") {
      const sum = x.min && x.max ? `${short(x.min)} – ${short(x.max)}` : x.max ? `до ${short(x.max)}` : x.min ? `от ${short(x.min)}` : null;
      facts = fact("Сумма", sum) + fact("Срок", x.termText) + fact("Обеспечение", x.collateralType) + fact("Первый взнос", x.downPayment) + fact("Погашение", x.repay) + fact("Льготный период", x.grace) + fact("Как выдают", x.payout) + fact("Где оформить", x.channel) + fact("Возраст", x.age ? `${x.age[0]}–${x.age[1]} лет` : null);
      lists = list("Документы", x.docs) + list("Требования", [...(x.requirements || []), ...(x.extra || [])]);
    } else if (K === "deposits") {
      facts = fact("Вид вклада", x.kind) + fact("Срок", x.termText) + fact("Выплата процентов", x.payout) + fact("Досрочное закрытие", x.early ? "Возможно" : null) + fact("Где открыть", x.channel);
      lists = list("Условия", x.extra);
    } else {
      facts = fact("Валюта", x.cur) + fact("Срок действия", x.validityYears ? `${x.validityYears} ${plural(x.validityYears, ["год", "года", "лет"])}` : null) + fact("Где оформить", x.channel) + fact("Акция", x.promo);
      lists = list("Условия", x.extra?.length ? x.extra : x.perks ? [x.perks] : []);
    }
    return `<div class="details">
      ${facts ? `<div class="facts">${facts}</div>` : ""}
      ${lists ? `<div class="dl-cols">${lists}</div>` : ""}
      <div class="details-act">
        <a class="btn btn-line btn-sm" href="${safeUrl(x.url)}" target="_blank" rel="noopener">Условия на Bank.uz ${icon("ext", "ic-s")}</a>
        <label class="check-cmp"><input type="checkbox" data-cmp="${x.id}"${inCompare(cmpKind, x.id) ? " checked" : ""}>Сравнить</label>
        ${x.updatedAt ? `<span class="cap">Обновлено ${esc(dateRu(x.updatedAt))}</span>` : ""}
      </div>
    </div>`;
  }
  function item(x, foot = "") {
    const open = openIds.has(x.id);
    return `<div class="offer-item" id="o-${x.id}">
      <div class="offer-main">
        <div class="offer-id">${bankLogo(x.bankId)}<div><div class="offer-bank">${esc(bankName(x.bankId))}</div><div class="offer-name">${esc(x.name)}</div></div></div>
        ${cols(x).map(([k, v]) => `<div class="kv"><div class="k">${k}</div><div class="v num" title="${esc(v)}">${esc(v)}</div></div>`).join("")}
        <div class="offer-act">
          <button class="btn btn-soft btn-sm" data-open="${x.id}" aria-expanded="${open}">Подробнее ${icon("down", "ic-s chev")}</button>
          ${x.bankUrl ? `<a class="btn btn-primary btn-sm" href="${safeUrl(x.bankUrl)}" target="_blank" rel="noopener">В банк ${icon("ext", "ic-s")}</a>` : ""}
        </div>
      </div>
      ${foot}
      ${open ? details(x) : ""}
    </div>`;
  }
  function card(g, isLead) {
    const [first, ...rest] = g;
    const kidsOpen = openBanks.has(first.bankId);
    const lead = isLead ? (K === "deposits" ? "Самая высокая ставка" : K === "credits" ? "Самая низкая ставка" : "") : "";
    const tg = tags(first, lead);
    return `<article class="offer">
      ${item(first, tg || rest.length ? `<div class="offer-foot">${tg}${rest.length ? `<button class="more" data-kids="${first.bankId}" aria-expanded="${kidsOpen}">Ещё ${rest.length} от банка ${icon("down", "ic-s chev")}</button>` : ""}</div>` : "")}
      ${kidsOpen ? `<div class="offer-kids">${rest.map((x) => item(x)).join("")}</div>` : ""}
    </article>`;
  }

  // ── Каркас ──
  const title = K === "credits" ? "Кредиты" : K === "deposits" ? "Вклады" : "Карты";
  const bankIds = [...new Set(all.map((x) => x.bankId))].sort((a, b) => bankName(a).localeCompare(bankName(b), "ru"));
  // «Без залога» — только когда в данных хватает кредитов с прямым «обеспечение не требуется» (как у banki.ru: фильтры по тому, что подтверждено)
  const canNoCol = K === "credits" && all.filter((x) => (type === "all" || x.type === type) && x.noCollateral).length >= 5;
  if (!canNoCol) f.flags.delete("nocol");
  const chipList = K === "credits" ? [["online", "Онлайн"], ...(canNoCol ? [["nocol", "Без залога"]] : []), ["targeted", "Целевые программы"]]
    : K === "deposits" ? [["topup", "Пополнение"], ["withdraw", "Снятие"], ["capitalization", "Капитализация"], ["online", "Онлайн"]]
    : [["free", "Бесплатный выпуск"], ["usd", "В долларах"], ["online", "Онлайн"]];

  root.innerHTML = `<div class="wrap page">
    <div class="page-head">
      <h1>${title}</h1>
      ${K === "credits" ? `<div class="seg seg-scroll" role="navigation" aria-label="Вид кредита"><a href="#/credits"${type === "all" ? ' aria-current="page"' : ""}>Все</a>${LOAN_TYPES.map((t) => `<a href="#/credits/${t.id}"${type === t.id ? ' aria-current="page"' : ""}>${t.many}</a>`).join("")}</div>` : ""}
      ${K === "deposits" ? `<div class="seg" role="group" aria-label="Валюта вклада">${[["UZS", "В сумах"], ["USD", "В долларах"], ["EUR", "В евро"]].map(([c, n]) => `<button data-cur="${c}" aria-pressed="${store.dep.cur === c}">${n}</button>`).join("")}</div>` : ""}
      ${K === "cards" ? `<div class="chips" id="sys" role="group" aria-label="Платёжная система"></div>` : ""}
    </div>
    ${K !== "cards" ? `<div class="ctl" id="ctl"></div>` : ""}
    <div class="bar">
      <div class="chips" id="chips"></div>
      <div class="bar-r"><span class="count num" id="count" aria-live="polite"></span>
        <label class="sort"><span class="sr">Банк</span><select id="bank"><option value="">Все банки</option>${bankIds.map((id) => `<option value="${id}"${f.bank === id ? " selected" : ""}>${esc(bankName(id))}</option>`).join("")}</select></label>
        <label class="sort"><span class="sr">Сортировка</span><select id="sort">${Object.entries(SORTS).map(([id, [name]]) => `<option value="${id}">${name}</option>`).join("")}</select></label>
      </div>
    </div>
    <div class="offers" id="list"></div>
    <button class="btn btn-line more-btn" id="more" hidden>Показать ещё</button>
  </div>`;

  // ── Сумма и срок ──
  let amountCtl = null;
  function paintCtl() {
    const ctl = $("#ctl", root);
    if (!ctl) return;
    if (K === "credits") {
      const st = store.loan;
      const terms = [...new Set([...LOAN_TERMS[type], ...(st.term ? [st.term] : [])])].sort((a, b) => a - b);
      ctl.innerHTML = `<div class="ctl-row two">
        <label class="field has-suffix"><span>Сколько вам нужно</span><input id="amount" inputmode="numeric" placeholder="Например, ${fmt(LOAN_SUMS[type][2])}" autocomplete="off"><i class="suffix">сум</i></label>
        <div class="ctl-presets" role="group" aria-label="Готовые суммы">${LOAN_SUMS[type].map((v) => `<button class="chip chip-soft" data-amount="${v}" aria-pressed="${st.amount === v}">${short(v)}</button>`).join("")}</div>
      </div>
      <div class="ctl-presets" role="group" aria-label="Срок"><span class="cap">Срок</span>${terms.map((m) => `<button class="chip chip-soft" data-term="${m}" aria-pressed="${st.term === m}">${term(m)}</button>`).join("")}</div>`;
      amountCtl = moneyInput($("#amount", ctl), (n) => { st.amount = n; save(); syncPresets(); paintList(); });
      amountCtl.set(st.amount);
    } else {
      const st = store.dep;
      ctl.innerHTML = `<div class="ctl-row two">
        <label class="field has-suffix"><span>Сколько хотите положить</span><input id="amount" inputmode="numeric" placeholder="Например, ${fmt(DEP_SUMS[st.cur][1])}" autocomplete="off"><i class="suffix">${CUR[st.cur]}</i></label>
        <div class="ctl-presets" role="group" aria-label="Готовые суммы">${DEP_SUMS[st.cur].map((v) => `<button class="chip chip-soft" data-amount="${v}" aria-pressed="${st.amount === v}">${st.cur === "UZS" ? short(v) : fmt(v)}</button>`).join("")}</div>
      </div>
      <div class="ctl-presets" role="group" aria-label="Срок">${DEP_TERMS.map(([id, name]) => `<button class="chip chip-soft" data-termb="${id}" aria-pressed="${f.termB === id}">${name}</button>`).join("")}</div>`;
      amountCtl = moneyInput($("#amount", ctl), (n) => { st.amount = n; save(); syncPresets(); paintList(); });
      amountCtl.set(st.amount);
    }
  }
  const syncPresets = () => { const a = (K === "credits" ? store.loan : store.dep).amount; $$("[data-amount]", root).forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.amount) === a))); };
  function paintChips() {
    if (K === "cards") $("#sys", root).innerHTML = SYS.map((s) => `<button class="chip" data-sys="${s}" aria-pressed="${f.sys.has(s)}">${s}</button>`).join("");
    const any = f.flags.size || f.sys.size || f.bank || f.termB !== "any";
    $("#chips", root).innerHTML = chipList.map(([id, name]) => `<button class="chip" data-flag="${id}" aria-pressed="${f.flags.has(id)}">${name}</button>`).join("") + (any ? `<button class="chip chip-reset" data-reset>Сбросить</button>` : "");
  }

  // ── Список ──
  function paintList() {
    const { total, groups: gs } = groups();
    if (focusId) {
      const gi = gs.findIndex((g) => g.some((x) => x.id === focusId));
      if (gi >= 0) { shown = Math.max(shown, gi + 1); if (gs[gi][0].id !== focusId) openBanks.add(gs[gi][0].bankId); }
    }
    $("#count", root).textContent = offersWord(total);
    const list = $("#list", root);
    if (!total) {
      list.innerHTML = `<div class="empty"><b class="h3">Под такие условия ничего нет</b><span class="muted small">Измените сумму, срок или уберите фильтры</span><button class="btn btn-primary btn-sm" data-reset="all">Сбросить всё</button></div>`;
    } else {
      // «самая низкая ставка» — только для обычных кредитов: целевые дешевле, но даются не всем
      const leadIdx = f.sort !== "rate" || K === "cards" || f.flags.has("targeted") ? -1 : gs.findIndex((g) => (K === "credits" ? !g[0].targeted && g[0].rateHi != null : g[0].rate != null));
      list.innerHTML = gs.slice(0, shown).map((g, i) => card(g, i === leadIdx)).join("");
    }
    const more = $("#more", root);
    more.hidden = gs.length <= shown;
    if (!more.hidden) more.textContent = `Показать ещё ${Math.min(PAGE, gs.length - shown)} из ${gs.length - shown}`;
    if (focusId) { const el = $(`#o-${focusId}`, root); focusId = null; if (el) requestAnimationFrame(() => el.closest(".offer").scrollIntoView({ block: "center" })); }
  }

  // ── События ──
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.amount) { const st = K === "credits" ? store.loan : store.dep; const v = Number(d.amount); st.amount = st.amount === v ? null : v; save(); amountCtl?.set(st.amount); syncPresets(); }
    else if (d.term) { const v = Number(d.term); store.loan.term = store.loan.term === v ? null : v; save(); $$("[data-term]", root).forEach((x) => x.setAttribute("aria-pressed", String(Number(x.dataset.term) === store.loan.term))); }
    else if (d.termb) { f.termB = d.termb; $$("[data-termb]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintChips(); }
    else if (d.cur) { store.dep.cur = d.cur; store.dep.amount = null; save(); $$("[data-cur]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintCtl(); }
    else if (d.flag) { f.flags.has(d.flag) ? f.flags.delete(d.flag) : f.flags.add(d.flag); paintChips(); }
    else if (d.sys) { f.sys.has(d.sys) ? f.sys.delete(d.sys) : f.sys.add(d.sys); paintChips(); }
    else if ("reset" in d) {
      f.flags.clear(); f.sys.clear(); f.bank = ""; f.termB = "any"; $("#bank", root).value = "";
      if (d.reset === "all") { if (K === "credits") { store.loan.amount = null; store.loan.term = null; } else if (K === "deposits") store.dep.amount = null; save(); }
      paintCtl(); paintChips();
    }
    else if (d.open) { const id = Number(d.open); openIds.has(id) ? openIds.delete(id) : openIds.add(id); }
    else if (d.kids) { openBanks.has(d.kids) ? openBanks.delete(d.kids) : openBanks.add(d.kids); }
    else if (b.id === "more") { shown += PAGE; }
    else return;
    shown = b.id === "more" || d.open || d.kids ? shown : PAGE;
    paintList();
    // список перерисован — возвращаем фокус на ту же кнопку
    const again = d.open ? `[data-open="${d.open}"]` : d.kids ? `[data-kids="${d.kids}"]` : d.flag ? `[data-flag="${d.flag}"]` : d.sys ? `[data-sys="${d.sys}"]` : null;
    if (again) $(again, root)?.focus({ preventScroll: true });
  });
  root.addEventListener("change", (e) => {
    if (e.target.id === "bank") { f.bank = e.target.value; shown = PAGE; paintChips(); paintList(); }
    else if (e.target.id === "sort") { f.sort = e.target.value; shown = PAGE; paintList(); }
    else if (e.target.dataset.cmp) { const ok = toggleCompare(cmpKind, Number(e.target.dataset.cmp)); if (!ok) e.target.checked = false; }
  });

  paintCtl(); paintChips(); paintList();
}
