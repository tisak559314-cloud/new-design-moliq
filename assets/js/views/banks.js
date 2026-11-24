// Банки: список, индекс жалоб ЦБ и страница банка — что у него есть и куда перейти.
import { esc, icon, fmt, plural } from "../lib.js";
import { db, atms, complaints, fxRows } from "../data.js";
import { bankLogo } from "../app.js";

const count = (list, id) => list.filter((x) => x.bankId === id).length;
/** 5,71 */
const idx = (v) => v.toFixed(2).replace(".", ",");
const TABS = (cur) => `<div class="seg" role="navigation" aria-label="Раздел"><a href="#/banks"${cur === "all" ? ' aria-current="page"' : ""}>Все банки</a><a href="#/banks/complaints"${cur === "complaints" ? ' aria-current="page"' : ""}>Индекс жалоб</a></div>`;

export default async function banks(root, { section, path }) {
  if (section === "bank" && db.bank[path[1]]) return bankPage(root, db.bank[path[1]]);
  if (path[1] === "complaints") return complaintsPage(root);
  const list = [...db.banks].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Банки</h1>${TABS("all")}</div>
    <div class="banks">${list.map((b) => {
      const l = count(db.loans, b.id), d = count(db.deposits, b.id), c = count(db.cards, b.id);
      return `<a class="bank-card" href="#/bank/${b.id}"><div class="best-head">${bankLogo(b.id)}<div><b>${esc(b.name)}</b></div></div>
        <p class="num">${[l && `${l} ${plural(l, ["кредит", "кредита", "кредитов"])}`, d && `${d} ${plural(d, ["вклад", "вклада", "вкладов"])}`, c && `${c} ${plural(c, ["карта", "карты", "карт"])}`].filter(Boolean).join(" · ") || "Нет предложений на Bank.uz"}</p></a>`;
    }).join("")}</div>
  </div>`;
}

/** Индекс жалоб ЦБ: доля жалоб на банк, делённая на его долю клиентов. Выше 1 — жалуются чаще, чем у банка клиентов */
async function complaintsPage(root) {
  const head = `<div class="page-head"><h1>Банки</h1>${TABS("complaints")}</div>`;
  let data;
  try { data = await complaints(); } catch {
    root.innerHTML = `<div class="wrap page">${head}<div class="empty"><b>Индекс не загрузился</b><span class="muted small">Обновите страницу</span></div></div>`;
    return;
  }
  const rows = data.rows.filter((r) => db.bank[r.bankId]), max = Math.max(...rows.map((r) => r.index));
  root.innerHTML = `<div class="wrap page">
    ${head}
    <div class="card idx">
      <div class="idx-head">
        <div><h2 class="h3">Индекс жалоб ЦБ</h2><p class="cap">${esc(data.period)}</p></div>
        <p class="idx-rule"><b>Выше 1</b> <span>— на банк жалуются чаще, чем у него клиентов</span></p>
      </div>
      <ol class="idx-list">${rows.map((r, i) => {
        const d = r.prev == null ? null : Math.round((r.index - r.prev) * 100) / 100;
        const delta = d == null ? `<span class="delta flat">новый в списке</span>` : d === 0 ? `<span class="delta flat">без изменений</span>`
          : `<span class="delta ${d > 0 ? "up" : "down"} num">${d > 0 ? "▲" : "▼"} ${idx(Math.abs(d))}</span>`;
        return `<li class="idx-row"><span class="idx-n num">${i + 1}</span>
          <a class="tbl-bank" href="#/bank/${r.bankId}">${bankLogo(r.bankId, "sm")}<span>${esc(db.bank[r.bankId].name)}</span></a>
          <span class="idx-bar" aria-hidden="true"><i style="width:${Math.round((r.index / max) * 100)}%"></i></span>
          <b class="idx-v num">${idx(r.index)}</b>${delta}</li>`;
      }).join("")}</ol>
      <p class="cap idx-note"><span>Всего жалоб в ЦБ:</span> <span class="num">${fmt(data.total)}</span>. <span>ЦБ называет первые десять банков и не считает индекс, если жалоб меньше ста.</span>
        <a class="link" href="${esc(data.source.url)}" target="_blank" rel="noopener">Публикация ЦБ</a></p>
    </div>
  </div>`;
}

function bankPage(root, b) {
  const l = count(db.loans, b.id), d = count(db.deposits, b.id), c = count(db.cards, b.id);
  const tile = (href, title, hint) => `<a class="tile" href="${href}" style="min-height:120px"><h2 class="tile-t">${title}</h2><p class="tile-h">${hint}</p></a>`;
  const fx = ["USD", "EUR", "RUB"].map((cur) => [cur, fxRows(cur).find((r) => r.bankId === b.id)]).filter(([, r]) => r);
  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><a class="link" href="#/banks" style="display:inline-flex;align-items:center;gap:4px;margin-bottom:16px">${icon("left", "ic-s")} Все банки</a>
      <div class="bank-hero">${bankLogo(b.id)}<h1>${esc(b.name)}</h1></div></div>
    <div class="tiles" style="grid-auto-rows:auto">
      ${l ? tile(`#/credits?bank=${b.id}`, "Кредиты", `<b class="num">${l}</b> ${plural(l, ["предложение", "предложения", "предложений"])}`) : ""}
      ${d ? tile(`#/deposits?bank=${b.id}`, "Вклады", `<b class="num">${d}</b> ${plural(d, ["предложение", "предложения", "предложений"])}`) : ""}
      ${c ? tile(`#/cards?bank=${b.id}`, "Карты", `<b class="num">${c}</b> ${plural(c, ["карта", "карты", "карт"])}`) : ""}
      <a class="tile" href="#/map?bank=${b.id}" style="min-height:120px"><h2 class="tile-t">Банкоматы</h2><p class="tile-h" id="b-atm">На карте</p></a>
    </div>
    <div id="b-idx"></div>
    ${fx.length ? `<section class="sec"><div class="sec-head"><h2>Курсы валют</h2><a class="link" href="#/rates">Все банки ${icon("right", "ic-s")}</a></div>
      <div class="tbl"><div class="tbl-row tbl-head"><div>Валюта</div><div>Банк покупает</div><div>Банк продаёт</div><div>Обновлено</div></div>
      ${fx.map(([cur, r]) => `<div class="tbl-row"><div class="tbl-bank"><span>${cur}</span></div><div><span class="v num">${r.buy ? fmt(r.buy) : "—"}</span></div><div><span class="v num">${r.sell ? fmt(r.sell) : "—"}</span></div><div class="cap num">${esc(r.updated || "")}</div></div>`).join("")}</div></section>` : ""}
  </div>`;
  let gone = false;
  atms().then((data) => {
    const n = data.banks.find((x) => x.id === b.id)?.count;
    const el = root.querySelector("#b-atm");
    if (!gone && el && n) el.innerHTML = `<b class="num">${fmt(n)}</b> на карте`;
  }).catch(() => { /* подсказка останется общей */ });
  // индекс жалоб ЦБ — только у банков, для которых ЦБ его назвал
  complaints().then((data) => {
    const i = data.rows.findIndex((r) => r.bankId === b.id), el = root.querySelector("#b-idx");
    if (gone || !el || i < 0) return;
    el.innerHTML = `<a class="idx-badge" href="#/banks/complaints">
      <div class="kv"><div class="k">Индекс жалоб ЦБ</div><div class="v num">${idx(data.rows[i].index)}</div><div class="s">${esc(data.period)}</div></div>
      <p><b>Выше 1</b> <span>— на банк жалуются чаще, чем у него клиентов</span></p>${icon("right")}</a>`;
  }).catch(() => { /* блок просто не появится */ });
  return () => { gone = true; };
}
