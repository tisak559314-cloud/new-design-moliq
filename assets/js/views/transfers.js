// Переводы с карты на карту без комиссии: где лимит больше, как разбить сумму и сколько лимита у вас осталось.
import { $, $$, esc, safeUrl, icon, fmt, short, pct, moneyInput } from "../lib.js";
import { p2p as loadP2p, db } from "../data.js";
import { store, save } from "../store.js";
import { bankLogo, dateRu } from "../app.js";

const SYS = { uzcard: "Uzcard", humo: "Humo", visa: "Visa" };
const SUMS = [1e6, 3e6, 5e6, 10e6];
const KEY = "moliq-nd-p2p-used";

/** Сколько человек уже перевёл в этом месяце: { month: "2026-11", used: { appId: сум } }. Новый месяц — лимиты снова целые */
function loadUsed() {
  const month = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent" }).format(new Date()).slice(0, 7);
  try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); if (s.month === month && s.used) return { month, used: s.used }; } catch { /* хранилище недоступно */ }
  return { month, used: {} };
}
const saveUsed = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* приватный режим */ } };

/**
 * Как перевести amount: сначала приложения с самым большим остатком лимита (так частей меньше всего),
 * остаток сверх лимитов — там, где комиссия после лимита ниже.
 */
export function plan(rows, amount) {
  const steps = [];
  let left = amount;
  for (const r of [...rows].sort((a, b) => b.free - a.free)) {
    if (left <= 0) break;
    if (r.free <= 0) continue;
    const part = Math.min(r.free, left);
    steps.push({ row: r, part, fee: 0 });
    left -= part;
  }
  if (left > 0) {
    const paid = rows.filter((r) => r.rule.feeAfter != null).sort((a, b) => a.rule.feeAfter - b.rule.feeAfter)[0];
    if (paid) { steps.push({ row: paid, part: left, fee: Math.round((left * paid.rule.feeAfter) / 100), pct: paid.rule.feeAfter }); left = 0; }
  }
  return { steps, left, fee: steps.reduce((s, x) => s + x.fee, 0) };
}

export default async function transfers(root) {
  const head = `<div class="page-head"><h1>Переводы без комиссии</h1></div>`;
  let data;
  try { data = await loadP2p(); } catch {
    root.innerHTML = `<div class="wrap page">${head}<div class="empty"><b>Тарифы не загрузились</b><span class="muted small">Обновите страницу</span></div></div>`;
    return;
  }
  const st = store.p2p, tracker = loadUsed();
  const tos = ["uzcard", "humo", "visa"].filter((t) => data.apps.some((a) => a.rules.some((r) => r.to.includes(t))));
  if (!tos.includes(st.to)) st.to = tos[0];
  // «с карты любого банка» — только там, где банк прямо так пишет; по умолчанию показываем все приложения
  let anyCard = false, editing = null;

  root.innerHTML = `<div class="wrap page">
    ${head}
    <div class="ctl p2p-ctl">
      <div class="p2p-dir">
        <div class="p2p-side"><span class="cap">С карты</span><div class="seg" role="group" aria-label="С карты">${["uzcard", "humo"].map((s) => `<button data-from="${s}" aria-pressed="${st.from === s}">${SYS[s]}</button>`).join("")}</div></div>
        <button class="icon-btn p2p-swap" data-swap aria-label="Поменять карты местами">${icon("fx")}</button>
        <div class="p2p-side"><span class="cap">На карту</span><div class="seg" role="group" aria-label="На карту">${tos.map((s) => `<button data-to="${s}" aria-pressed="${st.to === s}">${SYS[s]}</button>`).join("")}</div></div>
      </div>
      <div class="ctl-row two">
        <label class="field has-suffix"><span>Сколько переводите</span><input id="p-amount" inputmode="numeric" placeholder="Например, 5 000 000" autocomplete="off"><i class="suffix">сум</i></label>
        <div class="ctl-presets" role="group" aria-label="Готовые суммы">${SUMS.map((v) => `<button class="chip chip-soft" data-amount="${v}" aria-pressed="${st.amount === v}">${short(v)}</button>`).join("")}</div>
      </div>
      <div class="ctl-presets"><button class="chip chip-soft" data-any aria-pressed="false">С карты любого банка</button></div>
    </div>
    <div id="p-plan" aria-live="polite"></div>
    <section class="sec" aria-labelledby="p-t">
      <div class="sec-head"><h2 id="p-t">Где комиссии нет</h2><span class="cap num" id="p-n"></span></div>
      <div class="offers" id="p-list"></div>
      <p class="cap p2p-note">Банки меняют лимиты без предупреждения — перед переводом посмотрите комиссию в приложении. Тарифы проверены <span class="num">${esc(dateRu(data.checkedAt))}</span>.</p>
    </section>
  </div>`;

  /** Приложения, которые подходят под выбранные карты; free — сколько бесплатного лимита осталось у человека */
  function rows() {
    return data.apps.map((a) => {
      const rule = a.rules.find((r) => r.from.includes(st.from) && r.to.includes(st.to));
      if (!rule || (anyCard && a.ownCard !== false)) return null;
      const used = tracker.used[a.id] || 0;
      return { app: a, rule, used, free: Math.max(0, rule.limit - used) };
    }).filter(Boolean).sort((a, b) => b.free - a.free || b.rule.limit - a.rule.limit);
  }
  const logo = (a) => (a.bankId && db.bank[a.bankId] ? bankLogo(a.bankId) : `<span class="logo-b"><span class="ini" style="background:${esc(a.color || "#697180")}">${esc(a.short || a.app.slice(0, 2))}</span></span>`);
  const logoSm = (a) => logo(a).replace('class="logo-b', 'class="logo-b sm');

  function paintPlan(list) {
    const box = $("#p-plan", root);
    if (!st.amount || !list.length) { box.innerHTML = ""; return; }
    const p = plan(list, st.amount);
    const base = data.baseline ? Math.round((st.amount * data.baseline.pct) / 100) : null, saved = base != null ? base - p.fee : null;
    const title = p.left > 0 ? "Без комиссии получится только часть" : p.steps.length === 1 ? "Хватит одного приложения" : "Разбейте перевод на части";
    box.innerHTML = `<div class="card p2p-plan">
      <div class="p2p-plan-head">
        <div><h2 class="h3">${title}</h2></div>
        <div class="p2p-fee"><div class="kv"><div class="k">Комиссия</div><div class="v num">${fmt(p.fee)} сум</div></div>
          ${saved > 0 ? `<div class="kv p2p-saved"><div class="k">Сэкономите</div><div class="v num">${fmt(saved)} сум</div></div>` : ""}</div>
      </div>
      <ol class="p2p-steps">${p.steps.map((s) => `<li>${logoSm(s.row.app)}<b>${esc(s.row.app.app)}</b>
        <span class="p2p-part num">${fmt(s.part)} сум</span>
        ${s.fee ? `<span class="tag num">${s.row.rule.feeUpTo ? "до " : ""}${pct(s.pct)} · ${fmt(s.fee)} сум</span>` : `<span class="tag tag-green num">0%</span>`}</li>`).join("")}
        ${p.left > 0 ? `<li class="p2p-rest"><span>Остаток</span><span class="p2p-part num">${fmt(p.left)} сум</span><span class="tag">с комиссией</span></li>` : ""}</ol>
      ${saved > 0 ? `<p class="cap">Сравниваем с комиссией <span class="num">${pct(data.baseline.pct)}</span> — ${esc(data.baseline.label)}.</p>` : ""}
    </div>`;
  }

  function card(r) {
    const a = r.app, tags = [
      a.ownCard && `<span class="tag">Нужна карта банка</span>`,
      ...(a.needs || []).map((n) => `<span class="tag">${esc(n)}</span>`),
      a.promoUntil && `<span class="tag tag-blue">Акция до <span class="num">${esc(dateRu(a.promoUntil))}</span></span>`,
    ].filter(Boolean).join("");
    const usedBar = r.used ? `<div class="p2p-used"><span class="idx-bar" aria-hidden="true"><i style="width:${Math.min(100, Math.round((r.used / r.rule.limit) * 100))}%"></i></span>
        <span class="cap num">Осталось ${short(r.free)} из ${short(r.rule.limit)}</span><button class="chip-reset" data-reset="${a.id}">Сбросить</button></div>` : "";
    const form = editing === a.id ? `<form class="p2p-mark" data-mark="${a.id}">
        <label class="field has-suffix"><span>Сколько уже перевели в этом месяце</span><input inputmode="numeric" placeholder="Например, 3 000 000" autocomplete="off"><i class="suffix">сум</i></label>
        <button class="btn btn-primary">Сохранить</button></form>` : "";
    return `<article class="offer" id="p-${a.id}">
      <div class="offer-main">
        <div class="offer-id">${logo(a)}<div><div class="offer-bank">${esc(a.operator)}</div><div class="offer-name">${esc(a.app)}</div></div></div>
        <div class="kv"><div class="k">Без комиссии в месяц</div><div class="v num">до ${short(r.rule.limit)}</div></div>
        <div class="kv"><div class="k">Сверх лимита</div><div class="v num">${r.rule.feeAfter != null ? `${r.rule.feeUpTo ? "до " : ""}${pct(r.rule.feeAfter)}` : "—"}</div></div>
        <div class="kv"><div class="k">Проверено</div><div class="v num">${esc(dateRu(a.checkedAt))}</div></div>
        <div class="offer-act">
          <button class="btn btn-soft btn-sm" data-edit="${a.id}" aria-expanded="${editing === a.id}">Уже переводил</button>
          <a class="btn btn-primary btn-sm" href="${safeUrl(a.source?.url)}" target="_blank" rel="noopener">Тариф ${icon("ext", "ic-s")}</a>
        </div>
      </div>
      ${tags || usedBar ? `<div class="offer-foot">${tags}${usedBar}</div>` : ""}
      ${form}
    </article>`;
  }

  function paint() {
    const list = rows();
    paintPlan(list);
    $("#p-n", root).textContent = list.length ? `${list.length} из ${data.apps.length}` : "";
    $("#p-list", root).innerHTML = list.length ? list.map(card).join("")
      : `<div class="empty"><b>Для таких карт бесплатных переводов не нашли</b><span class="muted small">Поменяйте карты или снимите условие «С карты любого банка»</span></div>`;
    const f = $(".p2p-mark", root);
    if (f) { moneyInput($("input", f), () => {}); $("input", f).focus(); }
  }
  const sync = () => {
    $$("[data-from]", root).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.from === st.from)));
    $$("[data-to]", root).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.to === st.to)));
    $$("[data-amount]", root).forEach((x) => x.setAttribute("aria-pressed", String(Number(x.dataset.amount) === st.amount)));
  };

  const amountCtl = moneyInput($("#p-amount", root), (n) => { st.amount = n; save(); sync(); paint(); });
  amountCtl.set(st.amount);
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.from) st.from = b.dataset.from;
    else if (b.dataset.to) st.to = b.dataset.to;
    else if (b.dataset.swap != null) { if (st.to !== "visa") [st.from, st.to] = [st.to, st.from]; }
    else if (b.dataset.amount) { st.amount = st.amount === Number(b.dataset.amount) ? null : Number(b.dataset.amount); amountCtl.set(st.amount); }
    else if (b.dataset.any != null) { anyCard = !anyCard; b.setAttribute("aria-pressed", String(anyCard)); }
    else if (b.dataset.edit) editing = editing === b.dataset.edit ? null : b.dataset.edit;
    else if (b.dataset.reset) { delete tracker.used[b.dataset.reset]; saveUsed(tracker); }
    else return;
    save(); sync(); paint();
  });
  root.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-mark]");
    if (!f) return;
    e.preventDefault();
    const n = Number($("input", f).value.replace(/\D/g, ""));
    if (n > 0) tracker.used[f.dataset.mark] = n; else delete tracker.used[f.dataset.mark];
    saveUsed(tracker);
    editing = null;
    paint();
  });
  sync(); paint();
}
