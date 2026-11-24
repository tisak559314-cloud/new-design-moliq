// Что человек уже ввёл: сумма, срок, сравнение. Переход между страницами несёт это с собой.
const KEY = "moliq-nd";
const blank = { loan: { amount: null, term: null }, dep: { amount: null, term: null, cur: "UZS" }, check: { type: "micro", income: null, has: false, other: null }, gold: { g: 5, paid: null }, p2p: { from: "uzcard", to: "humo", amount: null }, cmp: [], lang: "ru" };
let saved = {};
try { saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { saved = {}; }
export const store = { ...blank, ...saved, loan: { ...blank.loan, ...saved.loan }, dep: { ...blank.dep, ...saved.dep }, check: { ...blank.check, ...saved.check }, gold: { ...blank.gold, ...saved.gold }, p2p: { ...blank.p2p, ...saved.p2p } };
export function save() { try { sessionStorage.setItem(KEY, JSON.stringify(store)); } catch { /* приватный режим */ } }
export const go = (hash) => { location.hash = hash; };
