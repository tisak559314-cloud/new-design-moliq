// Что человек уже ввёл: сумма, срок, сравнение. Переход между страницами несёт это с собой.
const KEY = "moliq-nd";
const blank = { loan: { amount: null, term: null }, dep: { amount: null, term: null, cur: "UZS" }, check: { type: "micro", income: null, has: false, other: null }, cmp: [], lang: "ru" };
let saved = {};
try { saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { saved = {}; }
export const store = { ...blank, ...saved, loan: { ...blank.loan, ...saved.loan }, dep: { ...blank.dep, ...saved.dep }, check: { ...blank.check, ...saved.check } };
export function save() { try { sessionStorage.setItem(KEY, JSON.stringify(store)); } catch { /* приватный режим */ } }
export const go = (hash) => { location.hash = hash; };
