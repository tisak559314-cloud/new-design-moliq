// Золотые слитки ЦБ: цена, выкуп, сколько теряете при продаже, мировая цена и где слитки есть сегодня.
import { $, $$, esc, flag, fmt, fmt2, pct, icon, plural, moneyInput } from "../lib.js";
import { gold as loadGold, db } from "../data.js";
import { store, save } from "../store.js";
import { bankLogo, dateRu } from "../app.js";
import { chartHtml, bindChart } from "../chart.js";
import { fxSeg } from "./rates.js";
import { tr } from "../i18n.js";
import { atmMap, yandexRoute } from "../mapkit.js";

const TASHKENT = "город Ташкент";
/** «2026-11-24T09:52» → «24.11.2026, 09:52» */
const stamp = (iso) => { const [d, t] = String(iso || "").split("T"); return d ? `${dateRu(d)}${t ? `, ${t}` : ""}` : ""; };

export default async function goldView(root) {
  const head = `<div class="page-head"><h1>Золотые слитки</h1>${fxSeg("gold")}</div>`;
  let data;
  try { data = await loadGold(); } catch {
    root.innerHTML = `<div class="wrap page">${head}<div class="empty"><b>Цены слитков не загрузились</b><span class="muted small">Обновите страницу</span></div></div>`;
    return;
  }
  const W = data.bars.map((b) => b.g);
  let g = W.includes(store.gold.g) ? store.gold.g : W[0];
  let paid = store.gold.paid, weight = 0;
  const regions = [...new Set(data.stock.map((s) => s.region))].sort((a, b) => (a === TASHKENT ? -1 : b === TASHKENT ? 1 : a.localeCompare(b, "ru")));
  let region = regions[0];
  const day = (data.pricesAt || data.fetchedAt || "").slice(0, 10);
  const perGram = Math.round(data.bars[data.bars.length - 1].sell / data.bars[data.bars.length - 1].g);

  root.innerHTML = `<div class="wrap page">
    ${head}
    <div class="rates-top">
      <div class="card rate-hero">
        <div class="seg seg-scroll" role="group" aria-label="Вес слитка">${W.map((w) => `<button data-g="${w}" aria-pressed="${w === g}">${w} г</button>`).join("")}</div>
        <div id="g-hero" class="g-hero"></div>
      </div>
      <div class="card conv">
        <h2 class="h3">Мой слиток</h2>
        <label class="field has-suffix"><span>Сколько заплатили</span><input id="g-paid" inputmode="numeric" placeholder="Например, 8 000 000" autocomplete="off"><i class="suffix">сум</i></label>
        <div class="conv-out" id="g-out" aria-live="polite"></div>
      </div>
    </div>
    <div class="g-facts">
      <div class="kv"><div class="k">1 г в слитке ЦБ</div><div class="v num">${fmt(perGram)} сум</div></div>
      ${data.worldGram ? `<div class="kv"><div class="k">1 г на мировом рынке</div><div class="v num">${fmt(data.worldGram)} сум</div><div class="s num">${fmt2(data.world.usdPerOz)} $ за унцию</div></div>
      <div class="kv"><div class="k">Наценка ЦБ к мировой цене</div><div class="v num">+${pct(Math.round((perGram / data.worldGram - 1) * 1000) / 10)}</div></div>` : ""}
    </div>
    <section class="sec" aria-labelledby="st-t">
      <div class="sec-head"><h2 id="st-t">Где есть слитки</h2>
        <label class="field select g-region"><span class="sr">Область</span><select id="g-region">${regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}</select></label>
      </div>
      <div class="chips" id="g-w"><button class="chip chip-soft" data-w="0" aria-pressed="true">Любой вес</button>${W.map((w) => `<button class="chip chip-soft" data-w="${w}" aria-pressed="false">${w} г</button>`).join("")}</div>
      <div class="g-map" id="g-map" hidden aria-label="Отделения со слитками на карте"></div>
      <div class="tbl g-stock" id="g-stock"></div>
      <p class="cap g-src">Остатки на <span class="num">${esc(stamp(data.stockAt))}</span> · <a class="link" href="${esc(data.stockUrl)}" target="_blank" rel="noopener">Центральный банк</a></p>
    </section>
  </div>`;

  // на телефоне переключатель шире экрана — показываем его конец, где выбранное «Золото»
  const seg = $(".page-head .seg", root);
  if (seg) seg.scrollLeft = seg.scrollWidth;
  document.title = `${tr("Золотые слитки")} — Moliq`;

  /** Цена выбранного слитка по дням */
  const series = () => { const i = W.indexOf(g); return data.history.map((h) => ({ d: h.d, v: h.sell?.[i] })).filter((p) => p.v > 0); };

  function paintHero() {
    const bar = data.bars.find((b) => b.g === g), pts = series();
    const prev = [...pts].reverse().find((p) => p.v !== bar.sell && p.d < day), d = prev ? bar.sell - prev.v : 0;
    const delta = !prev ? "" : `<span class="delta ${d > 0 ? "up" : "down"} num">${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d))}</span>`;
    const loss = bar.sell - bar.buy;
    $("#g-hero", root).innerHTML = `
      <div><div class="fx-top">${flag("XAU")}<b>Купить в банке</b>${delta}</div>
        <div class="fx-rate num">${fmt(bar.sell)}<small>сум · цена ЦБ на ${esc(dateRu(day))}</small></div></div>
      ${chartHtml(pts, { label: "Цена слитка по дням", caption: `${pts.length} ${plural(pts.length, ["день", "дня", "дней"])}`, f: fmt })}
      <div class="rate-trio">
        <div class="kv"><div class="k">Банк выкупит</div><div class="v num">${fmt(bar.buy)}</div><div class="s">в целой упаковке</div></div>
        <div class="kv"><div class="k">Повреждённая упаковка</div><div class="v num">${fmt(bar.buyDamaged)}</div><div class="s">после экспертизы</div></div>
        <div class="kv kv-wide"><div class="k">Если продать сразу, потеряете</div><div class="v num">${fmt(loss)} сум</div><div class="s num">${pct(Math.round((loss / bar.sell) * 1000) / 10)} цены</div></div>
      </div>`;
    bindChart($("#chart", root), pts, bar.sell, fmt);
  }

  function paintMine() {
    const bar = data.bars.find((b) => b.g === g), out = $("#g-out", root);
    if (!paid) { out.innerHTML = `<div class="k cap">Банк выкупит сегодня</div><div style="margin-top:8px"><span class="slot">Введите сумму</span></div>`; return; }
    const diff = bar.buy - paid;
    out.innerHTML = `<div class="k cap">Банк выкупит сегодня</div><div class="v num">${fmt(bar.buy)} сум</div>
      <div class="g-pl ${diff >= 0 ? "plus" : "minus"}"><span>${diff >= 0 ? "Вы в плюсе на" : "Вы в минусе на"}</span> <b class="num">${fmt(Math.abs(diff))} сум</b></div>
      <div class="cap num" style="margin-top:4px">${g} г · целая упаковка</div>`;
  }

  function paintStock() {
    const i = weight ? W.indexOf(weight) : -1;
    const rows = data.stock.filter((s) => s.region === region && (i < 0 || s.n[i] > 0))
      .sort((a, b) => (i < 0 ? b.n.reduce((x, y) => x + y, 0) - a.n.reduce((x, y) => x + y, 0) : b.n[i] - a.n[i]));
    const headRow = `<div class="g-row g-head"><div>Отделение</div>${W.map((w) => `<div class="g-n num">${w} г</div>`).join("")}<div></div></div>`;
    $("#g-stock", root).innerHTML = rows.length ? headRow + rows.map((s) => {
      const name = db.bank[s.bankId]?.name || s.bank;
      // отделение нашлось на нашей карте — сразу маршрут в Яндекс Картах; нет — поиск по названию
      const link = s.lat != null
        ? `<a class="link g-find" href="${esc(yandexRoute(s.lat, s.lng))}" target="_blank" rel="noopener" aria-label="Маршрут">${icon("route", "ic-s")}<span>Маршрут</span></a>`
        : `<a class="link g-find" href="${esc(`https://yandex.uz/maps/?text=${encodeURIComponent(`${name} ${s.branch} ${s.region}`)}`)}" target="_blank" rel="noopener" aria-label="Найти на карте">${icon("pin", "ic-s")}<span>Найти на карте</span></a>`;
      return `<div class="g-row">
        <div class="tbl-bank">${bankLogo(s.bankId, "sm")}<div class="g-name"><b>${esc(name)}</b><span>${esc(s.branch)}</span></div></div>
        ${W.map((w, k) => `<div class="g-n${w === weight ? " on" : ""}${s.n[k] ? "" : " none"}"><span class="g-w num">${w} г</span><b class="num">${s.n[k] || "—"}</b></div>`).join("")}
        ${link}
      </div>`;
    }).join("") : `<div class="empty"><b>Таких слитков здесь сегодня нет</b><span class="muted small">Выберите другой вес или область</span></div>`;
    paintMap(rows.filter((s) => s.lat != null));
  }

  // ── Карта отделений со слитками: те же строки, что в таблице; грузится, только когда до неё докрутили ──
  const geo = { banks: db.banks, atms: [] };
  const bankIdx = new Map(db.banks.map((b, i) => [b.id, i]));
  let gmap = null, gmapReq = null, gone = false;
  function fit() {
    if (!gmap || !geo.atms.length) return;
    gmap.setFilter({});
    const b = new gmap.gl.LngLatBounds();
    for (const a of geo.atms) b.extend([a[3], a[2]]);
    gmap.map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 0 });
  }
  function paintMap(located) {
    const el = $("#g-map", root);
    geo.atms = located.filter((s) => bankIdx.has(s.bankId)).map((s, i) => [i + 1, bankIdx.get(s.bankId), s.lat, s.lng, s.place || s.branch, -1, 1, 0]);
    el.hidden = !geo.atms.length;
    if (!geo.atms.length) return;
    if (gmap) return fit();
    if (gmapReq) return;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      gmapReq = atmMap(el, geo, { zoom: 10 }).then((m) => {
        if (gone) return m.remove();
        gmap = m;
        // отделений на карте десятки, а не тысячи банкоматов — точки крупнее, их видно на обзоре области
        m.map.setPaintProperty("atm-dots", "circle-radius", ["interpolate", ["linear"], ["zoom"], 6, 5, 12, 7]);
        m.map.setPaintProperty("atm-dots", "circle-stroke-width", 2);
        fit();
      }).catch(() => { el.hidden = true; });
    }, { rootMargin: "200px" });
    io.observe(el);
    gmapReq = true;
  }

  moneyInput($("#g-paid", root), (n) => { paid = n; store.gold.paid = n; save(); paintMine(); }).set(paid);
  $("#g-region", root).addEventListener("change", (e) => { region = e.target.value; paintStock(); });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.g) { g = Number(b.dataset.g); store.gold.g = g; save(); $$("[data-g]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintHero(); paintMine(); }
    else if (b?.dataset.w != null) { weight = Number(b.dataset.w); $$("[data-w]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paintStock(); }
  });
  paintHero(); paintMine(); paintStock();
  return () => { gone = true; gmap?.remove(); };
}
