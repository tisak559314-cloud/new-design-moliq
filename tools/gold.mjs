#!/usr/bin/env node
/**
 * Золотые слитки ЦБ → data/gold.json. Запуск: node tools/gold.mjs (раз в день, после 10:30 — ЦБ обновляет остатки утром).
 *
 * Что берётся и откуда:
 *   цены продажи и обратного выкупа слитков 5–100 г   — cbu.uz/ru/banknotes-coins/gold-bars/prices/
 *   сколько слитков в каком отделении банка            — cbu.uz/ru/banknotes-coins/gold-bars/balance/
 *   официальный курс доллара                           — cbu.uz/ru/arkhiv-kursov-valyut/json/USD/
 *   мировая цена унции (XAU/USD), справочно            — api.gold-api.com (без ключа, один запрос за запуск)
 * Каждый запуск дописывает день в историю цен: у ЦБ архива нет, график копится с первого запуска.
 * Страницы ЦБ открыты для роботов (robots.txt), запросы идут по одному с паузой.
 * Если разметка изменилась и таблица не разобралась, файл не перезаписывается.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../data/gold.json");
const CBU = "https://cbu.uz/ru/banknotes-coins/gold-bars";
const WEIGHTS = [5, 10, 20, 50, 100];
const OZ = 31.1034768; // граммов в тройской унции
const UA = "Mozilla/5.0 (compatible; moliq-data/1.0)";

/** Название банка в таблице ЦБ → id банка в каталоге */
const BANKS = [
  [/капиталбанк/i, "kapital"], [/ипотека/i, "ipoteka"], [/hamkor|хамкор/i, "hamkor"], [/infin/i, "infin"], [/узпромстрой|sqb/i, "sqb"],
  [/развития бизнеса|brb/i, "brb"], [/асака/i, "asaka"], [/агробанк/i, "agro"], [/траст/i, "trast"], [/ипак\s*йули/i, "ipakyuli"],
  [/турон/i, "turon"], [/asia alliance/i, "aab"], [/микрокредит/i, "mkb"], [/ориент финанс/i, "ofb"], [/anor/i, "anor"],
  [/гарант/i, "garant"], [/octo/i, "octo"], [/халк|xalq/i, "xalq"], [/узнацбанк|национальный банк|нбу/i, "nbu"], [/алока|aloqa/i, "aloqa"],
  [/давр/i, "davr"], [/универсал/i, "universal"], [/пойтахт/i, "poytaxt"], [/tenge/i, "tenge"], [/ziraat/i, "ziraat"], [/apex/i, "apex"],
];
const REGION_FIX = [[/Республикаи/i, "Республика"], [/Жиззакская/i, "Джизакская"]];
const MONTHS = ["янв", "фев", "мар", "апр", "ма", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
const text = (h) => decode(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const num = (s) => { const d = String(s).replace(/\D/g, ""); return d ? Number(d) : 0; };

async function get(url, as = "text") {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(40_000) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return as === "json" ? r.json() : r.text();
}

/** Строки первой таблицы страницы: массив массивов ячеек */
function tableRows(html) {
  const t = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
  return [...t.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1])));
}
/** «Дата обновления: 24 ноя 2026, 09:52» → 2026-11-24T09:52 */
function updatedAt(html) {
  const m = text(html).match(/Дата обновления:\s*(\d{1,2})\s+([а-яё]+)\.?\s+(\d{4}),\s*(\d{1,2}):(\d{2})/i);
  if (!m) return null;
  const mon = MONTHS.findIndex((x) => m[2].toLowerCase().startsWith(x));
  return mon < 0 ? null : `${m[3]}-${String(mon + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}T${m[4].padStart(2, "0")}:${m[5]}`;
}

export function parsePrices(html) {
  const bars = [];
  for (const c of tableRows(html)) {
    const g = c[0]?.match(/^(\d+)\s*грам/i);
    if (!g || c.length < 4) continue;
    bars.push({ g: Number(g[1]), sell: num(c[1]), buy: num(c[2]), buyDamaged: num(c[3]) });
  }
  return bars.filter((b) => WEIGHTS.includes(b.g) && b.sell > 0 && b.buy > 0);
}

export function parseStock(html) {
  const out = [];
  let region = null;
  for (let c of tableRows(html)) {
    if (c.length === 9) { region = c[1]; c = c.slice(2); } // первая строка области: №, область, …
    if (c.length !== 7 || !region) continue;
    const m = c[0].match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    const bank = (m ? m[1] : c[0]).replace(/»и$/, "»").trim();
    const n = c.slice(2).map(num);
    if (!n.some(Boolean)) continue; // слитков нет ни одного веса
    out.push({
      region: REGION_FIX.reduce((s, [re, to]) => s.replace(re, to), region),
      bankId: BANKS.find(([re]) => re.test(bank))?.[1] ?? null,
      bank, branch: (m ? m[2] : "").trim(), n,
    });
  }
  return out;
}

async function main() {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent" }).format(new Date());
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { /* первого запуска ещё не было */ }

  const pricesHtml = await get(`${CBU}/prices/`);
  await sleep(1200);
  const stockHtml = await get(`${CBU}/balance/`);
  await sleep(1200);
  const usd = Number((await get("https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/", "json"))?.[0]?.Rate);

  const bars = parsePrices(pricesHtml), stock = parseStock(stockHtml);
  if (bars.length !== WEIGHTS.length) throw new Error(`цены: разобрано ${bars.length} слитков из ${WEIGHTS.length} — разметка страницы ЦБ изменилась?`);
  if (stock.length < 40) throw new Error(`остатки: разобрано только ${stock.length} отделений — разметка страницы ЦБ изменилась?`);
  if (!(usd > 1000)) throw new Error("курс доллара ЦБ не получен");

  // мировая цена — справочная: сервис не ответил — остаётся прошлое значение со своей датой
  let world = prev?.world ?? null;
  try {
    const w = await get("https://api.gold-api.com/price/XAU", "json");
    if (w?.price > 500 && w.currency === "USD") world = { usdPerOz: Math.round(w.price * 100) / 100, at: w.updatedAt, source: { title: "gold-api.com", url: "https://www.gold-api.com/" } };
  } catch (e) { console.warn(`  ! мировая цена: ${e.message}${world ? " — остаётся прошлое значение" : ""}`); }
  const worldGram = world ? Math.round((world.usdPerOz / OZ) * usd) : null;

  const history = (prev?.history ?? []).filter((h) => h.d !== today);
  history.push({ d: today, sell: bars.map((b) => b.sell), buy: bars.map((b) => b.buy), ...(worldGram ? { world: worldGram } : {}) });

  const data = {
    source: { title: "Центральный банк Узбекистана", url: `${CBU}/prices/` },
    fetchedAt: today,
    pricesAt: updatedAt(pricesHtml), stockAt: updatedAt(stockHtml), stockUrl: `${CBU}/balance/`,
    usd, world, worldGram,
    bars, stock,
    history: history.slice(-400),
  };
  fs.writeFileSync(OUT, JSON.stringify(data));
  const unknown = [...new Set(stock.filter((s) => !s.bankId).map((s) => s.bank))];
  console.log(`Золото: цены от ${data.pricesAt}, слиток 5 г — ${bars[0].sell} сум; отделений со слитками ${stock.length} (${new Set(stock.map((s) => s.region)).size} областей); 1 г в мире — ${worldGram ?? "нет данных"} сум; дней в истории ${data.history.length} → ${OUT}`);
  if (unknown.length) console.log(`  банк не из каталога: ${unknown.join(", ")}`);
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
