#!/usr/bin/env node
/**
 * Логотипы компаний для раздела «Акции»: assets/stocks/<ТИКЕР>.<jpg|png|webp> и список assets/js/stock-logos.js.
 * Запуск вручную, когда на бирже появились новые компании: node tools/stock-logos.mjs (уже скачанные не трогает).
 *
 * Откуда: котировальный лист биржи «Тошкент» (uzse.uz/isu_infos) — у каждого эмитента там картинка-аватар.
 * Копируем к себе, а не грузим с биржи у посетителей. Биржа просит роботов не чаще запроса в минуту (robots.txt:
 * Crawl-delay: 60), поэтому скачивание идёт ~1 мин на логотип. Банки сюда не входят: у них логотипы сайта
 * (assets/banks), соответствие тикеров — BANK_LOGO в views/stocks.js. Привилегированные акции берут логотип своей
 * обыкновенной (тикер без «P» на конце).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "assets/stocks");
const LIST = path.join(ROOT, "assets/js/stock-logos.js");
const UZSE = "https://uzse.uz";
const UA = "Mozilla/5.0 (compatible; Moliq-data-import/1.0)";
// тикеры банков — у них логотипы сайта (assets/banks)
const BANKS = new Set("SQBN AGBA IPTB HMKB IPKY ALKB TNBN TRSB UNVB BRBN KPBA MCBA GRBK ORFI XKBK INFB TGBK DRBK ASBU".split(" "));
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const robots = await fetch(`${UZSE}/robots.txt`, { headers: { "User-Agent": UA } }).then((r) => r.text()).catch(() => "");
  const star = robots.split(/\n(?=User-agent:)/i).find((g) => /User-agent:\s*\*/i.test(g)) ?? "";
  const delay = (Math.max(60, Number(star.match(/Crawl-delay:\s*(\d+)/i)?.[1] ?? 60)) + 1) * 1000;
  let last = Date.now();
  const get = async (url) => {
    const wait = last + delay - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(60_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  };

  const html = await (await get(`${UZSE}/isu_infos?locale=ru`)).text();
  const rows = [];
  for (const tr of html.match(/<tr>\s*<td class="idx">[\s\S]*?<\/tr>/g) ?? []) {
    const t = tr.match(/<td class="tic"><a[^>]*>\s*([A-Z0-9]+)\s*<\/a>/)?.[1];
    const src = tr.match(/<img class="ava" src="([^"]+)"/)?.[1];
    if (t && src && !/cat bond/.test(tr) && !BANKS.has(t) && !BANKS.has(t.replace(/P$/, ""))) rows.push({ t, src: new URL(src, UZSE).href });
  }
  fs.mkdirSync(DIR, { recursive: true });
  const have = () => Object.fromEntries(fs.readdirSync(DIR).filter((f) => /\.(jpg|png|webp|svg)$/.test(f)).map((f) => [f.replace(/\.\w+$/, ""), f]));
  const todo = rows.filter((r) => !have()[r.t]);
  console.log(`Логотипов на бирже (без банков): ${rows.length}, скачать: ${todo.length} (~${todo.length} мин)`);
  for (const r of todo) {
    try {
      const res = await get(r.src);
      const ext = EXT[(res.headers.get("content-type") || "").split(";")[0]];
      if (!ext) throw new Error(`не картинка: ${res.headers.get("content-type")}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) throw new Error("пустая картинка");
      fs.writeFileSync(path.join(DIR, `${r.t}.${ext}`), buf);
      console.log(`  ✓ ${r.t}.${ext} (${Math.round(buf.length / 1024)} КБ)`);
    } catch (e) { console.warn(`  ! ${r.t}: ${e.message}`); }
    writeList(have());
  }
  writeList(have());
  console.log(`Готово: ${Object.keys(have()).length} логотипов, список — assets/js/stock-logos.js`);
}

function writeList(files) {
  const body = Object.entries(files).sort().map(([t, f]) => `  ${t}: "${f}",`).join("\n");
  fs.writeFileSync(LIST, `// Логотипы компаний раздела «Акции» (assets/stocks): тикер → файл. Пишет tools/stock-logos.mjs — руками не править.\nexport const STOCK_LOGOS = {\n${body}\n};\n`);
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
