#!/usr/bin/env node
/**
 * Обновить данные нового сайта одним запуском (его вызывает moliq/scripts/update.sh, можно и вручную):
 *
 *   node tools/refresh.mjs --from=../moliq/bankmap-next/public/data [--skip=atms.json,rates.json]
 *   node tools/refresh.mjs --from-site=https://moliq.antigradient.uz     то же, но копии качаются с основного сайта
 *
 * 1. Каталог, курсы, история курсов и карта — копии данных основного сайта: из его папки (--from, так делает update.sh)
 *    или из опубликованного на нём (--from-site, так делает расписание в GitHub: .github/workflows/data.yml).
 *    Файлы из --skip не трогаются: так update.sh не переносит набор, не прошедший проверку. Без обоих ключей шаг пропускается.
 * 2. Золото — tools/gold.mjs (цены и остатки слитков ЦБ, мировая цена, ещё один день в историю).
 * 3. Переводы без комиссии — лимиты в data/p2p.json ведутся вручную, сами не меняются. Здесь проверяется, что число,
 *    на которое мы ссылаемся, всё ещё стоит на странице банка (поле watch: адрес и фразы). Стоит — дата «Проверено»
 *    обновляется; исчезло — предупреждение «проверьте тариф», данные остаются прежними. Плюс напоминания: акция
 *    закончилась или кончается, запись давно не проверялась.
 * 4. Индекс жалоб ЦБ — раз в квартал вручную; здесь только напоминание, когда пора искать новую публикацию.
 *
 * Ничего не публикует: что изменилось в data/, коммитит и пушит update.sh.
 * Код выхода 0, если шаги отработали (предупреждения — не ошибка); 1 — если не обновилось золото или не скопировался файл.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const UA = "Mozilla/5.0 (compatible; moliq-data/1.0)";
const COPY = ["catalog.json", "rates.json", "rates-history.json", "atms.json"];
const STALE_DAYS = 45, PROMO_SOON_DAYS = 14;

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent" }).format(new Date());
const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const warnings = [];
const warn = (t) => { warnings.push(t); console.log(`  ⚠️  ${t}`); };
let failed = false;

// ── 1. копии данных основного сайта ──
/** Записать файл в data/, если он годный и отличается от нынешнего */
function put(name, buf) {
  const dst = path.join(DATA, name), next = JSON.parse(buf);
  // карта без адресов и подробностей — не та версия, что опубликована: новый сайт показывает адреса
  if (name === "atms.json" && !(next.detailsFormat && next.atms?.length >= 4000)) { warn(`${name}: в источнике нет адресов или мало точек — оставляю прежний`); return; }
  if (fs.existsSync(dst) && Buffer.compare(buf, fs.readFileSync(dst)) === 0) { console.log(`  = ${name}: без изменений`); return; }
  fs.writeFileSync(dst, buf);
  console.log(`  ✓ ${name}: обновлён`);
}
async function copyData() {
  const from = arg("from"), site = arg("from-site")?.replace(/\/+$/, "");
  if (!from && !site) return; // переносить нечего: обновляется только своё — золото, переводы, индекс жалоб
  console.log("Новый сайт · каталог, курсы и карта");
  const skip = new Set((arg("skip") || "").split(",").filter(Boolean));
  let manifest = null;
  if (site) {
    try {
      const r = await fetch(`${site}/api/data/manifest`, { headers: { "User-Agent": UA, "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(30_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      manifest = await r.json();
    } catch (e) { failed = true; warn(`основной сайт не отдал список данных (${e.message}) — каталог, курсы и карта остаются прежними`); return; }
  }
  for (const name of COPY) {
    if (skip.has(name)) { console.log(`  – ${name}: не прошёл проверку основного сайта — оставляю прежний`); continue; }
    try {
      if (site) {
        const url = manifest.files?.[name]?.url;
        if (!url) { warn(`${name}: на основном сайте не опубликован — оставляю прежний`); continue; }
        const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(120_000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        put(name, Buffer.from(await r.arrayBuffer()));
      } else put(name, fs.readFileSync(path.resolve(from, name)));
    } catch (e) { failed = true; warn(`${name}: не обновлён — ${e.message}`); }
  }
}

// ── 2. золото ──
function gold() {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/gold.mjs")], { encoding: "utf8", timeout: 180_000 });
  const out = (r.stdout || "").trimEnd();
  if (out) console.log(out.replace(/^/gm, "  "));
  if (r.status !== 0) { failed = true; warn(`золото не обновилось — на сайте остаются прошлые цены: ${(r.stderr || "").trim().split("\n").pop() || "нет ответа"}`); }
}

// ── 3. переводы без комиссии ──
/** Правила robots.txt для всех роботов: список запрещённых начал пути; null — файл не загрузился (тогда страницу не открываем) */
async function disallowed(origin) {
  try {
    const r = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
    if (r.status >= 400 && r.status < 500) return [];
    if (!r.ok) return null;
    const out = [];
    let mine = false;
    for (const line of (await r.text()).split("\n")) {
      const m = line.replace(/#.*/, "").match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*$/i);
      if (!m) continue;
      const k = m[1].toLowerCase();
      if (k === "user-agent") mine = m[2] === "*";
      else if (k === "disallow" && mine && m[2]) out.push(m[2]);
    }
    return out;
  } catch { return null; }
}
const blocked = (rules, pathname) => rules.some((p) => { const re = new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}`); return re.test(pathname); });
const plain = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").toLowerCase();

async function p2p() {
  const file = path.join(DATA, "p2p.json"), data = readJson(file), robots = new Map();
  let changed = false;
  for (const a of data.apps) {
    if (a.promoUntil) {
      const left = days(a.promoUntil, today);
      if (left < 0) warn(`${a.app}: акция закончилась ${a.promoUntil} — сайт запись уже не показывает; обновите или удалите её в data/p2p.json`);
      else if (left <= PROMO_SOON_DAYS) warn(`${a.app}: акция кончается ${a.promoUntil} — проверьте, продлил ли её банк`);
    }
    if (!a.watch?.url) { if (days(today, a.checkedAt) > STALE_DAYS) warn(`${a.app}: не проверялся с ${a.checkedAt}, страницы для автопроверки нет — посмотрите ${a.source?.url}`); continue; }
    const u = new URL(a.watch.url);
    if (!robots.has(u.origin)) robots.set(u.origin, await disallowed(u.origin));
    const rules = robots.get(u.origin);
    if (rules === null || blocked(rules, u.pathname)) { console.log(`  – ${a.app}: страницу роботам открывать нельзя или robots.txt не ответил — не проверяю`); if (days(today, a.checkedAt) > STALE_DAYS) warn(`${a.app}: не проверялся с ${a.checkedAt} — посмотрите ${a.watch.url}`); continue; }
    try {
      const r = await fetch(a.watch.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(40_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = plain(await r.text()), missing = a.watch.has.filter((p) => !text.includes(p.toLowerCase()));
      if (missing.length) warn(`${a.app}: на странице больше нет «${missing.join("», «")}» — проверьте тариф: ${a.watch.url}`);
      else { console.log(`  ✓ ${a.app}: лимит на странице банка тот же`); if (a.checkedAt !== today) { a.checkedAt = today; changed = true; } }
    } catch (e) {
      console.log(`  ? ${a.app}: страница не открылась (${e.message}) — остаётся дата проверки ${a.checkedAt}`);
      if (days(today, a.checkedAt) > STALE_DAYS) warn(`${a.app}: не проверялся с ${a.checkedAt} — посмотрите ${a.watch.url}`);
    }
    await sleep(1000);
  }
  if (changed) { data.checkedAt = today; fs.writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`); }
}

// ── 4. индекс жалоб ──
function complaints() {
  const data = readJson(path.join(DATA, "complaints.json")), m = String(data.quarter || "").match(/^(\d{4})-Q([1-4])$/);
  if (!m) { warn("complaints.json: нет поля quarter (ГГГГ-QN) — не могу напомнить о новом квартале"); return; }
  // следующий квартал кончается через три месяца после нашего; ЦБ публикует индекс примерно через три недели
  const y = Number(m[1]), q = Number(m[2]), nextEnd = new Date(Date.UTC(q === 4 ? y + 1 : y, q === 4 ? 3 : q * 3 + 3, 0));
  const due = new Date(nextEnd.getTime() + 21 * 86_400_000).toISOString().slice(0, 10);
  if (today >= due) warn(`индекс жалоб: на сайте ${data.period}, а ЦБ уже должен был опубликовать следующий квартал — обновите data/complaints.json (${data.source?.url})`);
  else console.log(`  ✓ индекс жалоб: ${data.period}; следующий квартал ЦБ опубликует примерно ${due}`);
}

await copyData();
console.log("Новый сайт · золото");
gold();
console.log("Новый сайт · переводы без комиссии");
try { await p2p(); } catch (e) { warn(`переводы не проверены: ${e.message}`); }
console.log("Новый сайт · индекс жалоб ЦБ");
try { complaints(); } catch (e) { warn(`индекс жалоб не проверен: ${e.message}`); }
console.log(warnings.length ? `Новый сайт: готово, предупреждений ${warnings.length}` : "Новый сайт: готово, всё в порядке");
process.exit(failed ? 1 : 0);
