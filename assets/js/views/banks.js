// Банки: список и страница банка — что у него есть и куда перейти.
import { esc, icon, fmt, plural } from "../lib.js";
import { db, atms, fxRows } from "../data.js";
import { bankLogo } from "../app.js";

const count = (list, id) => list.filter((x) => x.bankId === id).length;

export default async function banks(root, { section, path }) {
  if (section === "bank" && db.bank[path[1]]) return bankPage(root, db.bank[path[1]]);
  const list = [...db.banks].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  root.innerHTML = `<div class="wrap page">
    <div class="page-head"><h1>Банки</h1></div>
    <div class="banks">${list.map((b) => {
      const l = count(db.loans, b.id), d = count(db.deposits, b.id), c = count(db.cards, b.id);
      return `<a class="bank-card" href="#/bank/${b.id}"><div class="best-head">${bankLogo(b.id)}<div><b>${esc(b.name)}</b></div></div>
        <p class="num">${[l && `${l} ${plural(l, ["кредит", "кредита", "кредитов"])}`, d && `${d} ${plural(d, ["вклад", "вклада", "вкладов"])}`, c && `${c} ${plural(c, ["карта", "карты", "карт"])}`].filter(Boolean).join(" · ") || "Нет предложений на портале ЦБ"}</p></a>`;
    }).join("")}</div>
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
  return () => { gone = true; };
}
