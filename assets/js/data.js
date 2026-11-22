// Данные сайта: каталог ЦБ (кредиты, вклады, карты), курсы, банкоматы. Снимок от даты fetchedAt.
import { median } from "./lib.js";

const cache = {};
const load = (name) => (cache[name] ??= fetch(`data/${name}.json`).then((r) => { if (!r.ok) throw new Error(`${name}: ${r.status}`); return r.json(); }));

export const LOAN_TYPES = [
  { id: "micro", name: "Микрозайм", many: "Микрозаймы", maxTerm: 36 },
  { id: "consumer", name: "Потребительский", many: "Потребительские", maxTerm: 60 },
  { id: "auto", name: "Автокредит", many: "Автокредиты", maxTerm: 60 },
  { id: "mortgage", name: "Ипотека", many: "Ипотека", maxTerm: 240 },
  { id: "edu", name: "Образовательный", many: "Образовательные", maxTerm: 120 },
];

// Целевые программы (для бизнеса, молодёжи, на энергосбережение и т. п.) и овердрафты: дешевле обычных, но даются
// только под свою цель. Признака в данных нет — узнаём по названию, как и помощник на сайте.
const TARGETED_RE = /предприним|бизнес|biznes|business|tadbirkor|ishbilarmon|самозанят|фермер|дехкан|agro|агро|bog|лимон|yosh|молод[её]ж|oila|семейн|пенсион|женщин|ayol|hunarmand|ремесл|green|зел[её]н|яшил|солнечн|энерг|energy|sunlight|eco|экокредит|mahalla|махалл|kelajak|imkon|первый шаг|birinchi qadam|госслужащ|бюджет|byudjet|jdu|инвестиц|kontur|рефинанс|овердрафт|overdraft/i;

let ready;
export const db = { banks: [], bank: {}, loans: [], deposits: [], cards: [], rates: null, date: "" };

/** Каталог и курсы — нужны почти на каждой странице, грузим один раз */
export function init() {
  return (ready ??= Promise.all([load("catalog"), load("rates"), load("rates-history")]).then(([cat, rates, hist]) => {
    db.banks = cat.banks;
    db.bank = Object.fromEntries(cat.banks.map((b) => [b.id, b]));
    db.date = cat.fetchedAt;
    db.source = cat.source;
    db.loans = cat.loans.map((l) => ({
      ...l,
      rateLo: l.rate?.[0] ?? null,
      rateHi: l.rate?.[1] ?? l.rate?.[0] ?? null,
      termLo: l.term?.[0] ?? null,
      termHi: l.term?.[1] ?? null,
      targeted: TARGETED_RE.test(l.name || ""),
      // «без залога» — только когда банк прямо так пишет
      noCollateral: l.collateral === false || /без обеспечения/i.test(l.collateralType || ""),
    }));
    db.deposits = cat.deposits.map((d) => ({ ...d, termLo: d.term?.[0] ?? null, termHi: d.term?.[1] ?? null }));
    db.cards = cat.cards;
    db.rates = rates;
    db.history = hist.days;
    return db;
  }));
}
export const atms = () => load("atms");

export const bankName = (id) => db.bank[id]?.name || id;
export const stats = {
  loanCount: (type) => db.loans.filter((l) => !type || l.type === type).length,
  /** Типичная ставка по виду кредита — медиана нижних ставок банков */
  loanMedian: (type) => median(db.loans.filter((l) => l.type === type && l.rateLo != null).map((l) => l.rateLo)),
  loanMin: (type) => Math.min(...db.loans.filter((l) => (!type || l.type === type) && l.rateLo > 0).map((l) => l.rateLo)),
  depMax: (cur = "UZS") => Math.max(...db.deposits.filter((d) => d.cur === cur && d.rate != null).map((d) => d.rate)),
};

/** Курс: лучший для человека по всем каналам банка. buy — банк покупает у вас, sell — продаёт вам */
export function fxRows(cur, channel = "any") {
  const rows = [];
  for (const r of db.rates.rows) {
    const byCh = r.rates?.[cur];
    if (!byCh) continue;
    let buy = null, sell = null;
    for (const [ch, pair] of Object.entries(byCh)) {
      if (channel !== "any" && ch !== channel) continue;
      const [b, s] = pair || [];
      if (b > 0 && (buy == null || b > buy)) buy = b;
      if (s > 0 && (sell == null || s < sell)) sell = s;
    }
    if (buy != null || sell != null) rows.push({ bankId: r.bankId, bank: bankName(r.bankId) === r.bankId ? r.bank : bankName(r.bankId), buy, sell, updated: r.updated });
  }
  return rows;
}
export function fxBest(cur, channel = "any") {
  const rows = fxRows(cur, channel);
  const withSell = rows.filter((r) => r.sell), withBuy = rows.filter((r) => r.buy);
  return {
    cheapest: withSell.length ? withSell.reduce((a, b) => (b.sell < a.sell ? b : a)) : null,
    dearest: withBuy.length ? withBuy.reduce((a, b) => (b.buy > a.buy ? b : a)) : null,
  };
}
/** Изменение курса ЦБ за день */
export function fxDelta(cur) {
  const d = db.history, now = db.rates.cbu[cur];
  for (let i = d.length - 1; i >= 0; i--) {
    const v = d[i].cbu?.[cur];
    if (v && Math.abs(v - now) > 1e-9) return now - v;
  }
  return 0;
}
