// Банкоматы на карте: фильтры слева, карта справа, по нажатию — адрес и маршрут.
import { $, $$, esc, icon, fmt, plural, toast } from "../lib.js";
import { atms, bankName } from "../data.js";
import { bankLogo } from "../app.js";
import { atmMap, atmOf, atmFits, countAtms, yandexRoute, SYSTEMS, FLAG_BITS, TASHKENT } from "../mapkit.js";

const CHIPS = [["s1", "Humo"], ["s0", "Uzcard"], ["s2", "Visa"], ["s3", "Mastercard"], ["h24", "Круглосуточно"], ["cashIn", "Пополнение"], ["fx", "Валюта"]];
const isSys = (k) => /^s\d$/.test(k);
const km = (a, b) => { const R = 6371, dLat = (b[1] - a[1]) * Math.PI / 180, dLng = (b[0] - a[0]) * Math.PI / 180, x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const dist = (d) => (d < 1 ? `${Math.round(d * 100) * 10} м` : `${String(Math.round(d * 10) / 10).replace(".", ",")} км`);

export default async function mapView(root, { query }) {
  const on = new Set((query.get("f") || "").split(",").filter((k) => CHIPS.some(([id]) => id === k)));
  let bank = query.get("bank") || "", me = null, kit = null, gone = false, popup = null;
  const filterOf = () => ({ bank, sys: [...on].filter(isSys).map((k) => Number(k[1])), flags: [...on].filter((k) => !isSys(k)) });

  root.innerHTML = `<div class="map-page">
    <aside class="map-side">
      <div class="map-filters">
        <h1>Банкоматы</h1>
        <label class="field select" style="height:52px"><span class="sr">Банк</span><select id="m-bank"><option value="">Все банки</option></select></label>
        <div class="chips" id="m-chips">${CHIPS.map(([id, name]) => `<button class="chip chip-soft" data-f="${id}" aria-pressed="${on.has(id)}">${name}</button>`).join("")}</div>
        <div class="cap num" id="m-count" aria-live="polite">Загружаем банкоматы…</div>
      </div>
      <div class="map-list" id="m-list"></div>
    </aside>
    <div class="map-canvas">
      <div class="mapbox" id="m-map" role="application" aria-label="Карта банкоматов"></div>
      <button class="btn btn-line btn-sm map-locate" id="m-me">${icon("locate", "ic-s")} Рядом со мной</button>
    </div>
  </div>`;

  let data = null;

  function show(atm) {
    if (!kit) return;
    popup?.remove();
    const tags = [atm.flags & FLAG_BITS.h24 && "Круглосуточно", atm.flags & FLAG_BITS.cashIn && "Пополнение", atm.flags & FLAG_BITS.fx && "Валюта"].filter(Boolean);
    const sys = SYSTEMS.filter((_, i) => atm.sys & (1 << i)).join(", ");
    popup = new kit.gl.Popup({ offset: 14, maxWidth: "320px" }).setLngLat([atm.lng, atm.lat]).setHTML(`<div class="map-pop">
      <div class="best-head">${bankLogo(atm.bank?.id, "sm")}<div><b>${esc(atm.bank?.name || "Банкомат")}</b><span>${esc(atm.name)}</span></div></div>
      ${atm.address ? `<p>${esc(atm.address)}</p>` : ""}
      ${tags.length ? `<div class="chips" style="gap:6px">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      ${sys ? `<p class="cap">${esc(sys)}</p>` : ""}
      <a class="btn btn-primary btn-sm" href="${yandexRoute(atm.lat, atm.lng, me && [me[1], me[0]])}" target="_blank" rel="noopener">${icon("route", "ic-s")} Маршрут</a>
    </div>`).addTo(kit.map);
  }
  function paintList() {
    const f = filterOf(), n = countAtms(data, f);
    $("#m-count", root).textContent = `${fmt(n)} ${plural(n, ["банкомат", "банкомата", "банкоматов"])}${bank ? ` · ${bankName(bank)}` : ""}`;
    if (!kit) return;
    const c = kit.map.getCenter(), from = me || [c.lng, c.lat], bounds = kit.map.getBounds();
    const near = data.atms.filter((a) => atmFits(data, a, f) && (me || bounds.contains([a[3], a[2]]))).map((a) => [km(from, [a[3], a[2]]), a]).sort((x, y) => x[0] - y[0]).slice(0, 40);
    $("#m-list", root).innerHTML = near.length ? near.map(([d, a]) => { const t = atmOf(data, a); return `<button class="map-item" data-atm="${t.id}">${bankLogo(t.bank?.id, "sm")}<div><b>${esc(t.bank?.name || "")}</b><span>${esc(t.address || t.name)}</span></div><span class="dist num">${dist(d)}</span></button>`; }).join("")
      : `<div class="empty" style="padding:24px 12px"><b>Здесь таких банкоматов нет</b><span class="muted small">Отодвиньте карту или уберите фильтр</span></div>`;
  }

  // Данные и карта догружаются в фоне: страница отдаёт «уборку» сразу, и уход с неё во время загрузки ничего не ломает
  (async () => {
    try { data = await atms(); } catch { if (!gone) $("#m-count", root).textContent = "Не удалось загрузить банкоматы. Обновите страницу."; return; }
    if (gone) return;
    $("#m-bank", root).innerHTML = `<option value="">Все банки</option>` + data.banks.filter((b) => b.count).sort((a, b) => a.name.localeCompare(b.name, "ru")).map((b) => `<option value="${b.id}"${b.id === bank ? " selected" : ""}>${esc(b.name)} · ${fmt(b.count)}</option>`).join("");
    paintList();
    try {
      const made = await atmMap($("#m-map", root), data, { zoom: bank ? 10.5 : 11.5, filter: filterOf(), onPick: show });
      if (gone) { made.remove(); return; }
      kit = made;
      kit.map.addControl(new kit.gl.NavigationControl({ showCompass: false }), "top-right");
      kit.map.on("moveend", paintList);
      paintList();
    } catch { if (!gone) toast("Карта не загрузилась — проверьте интернет"); }
  })();

  const apply = () => { kit?.setFilter(filterOf()); popup?.remove(); paintList(); };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || !data) return;
    if (b.dataset.f) { const k = b.dataset.f; on.has(k) ? on.delete(k) : on.add(k); b.setAttribute("aria-pressed", String(on.has(k))); apply(); }
    else if (b.dataset.atm) { const row = data.atms.find((a) => a[0] === Number(b.dataset.atm)); if (row && kit) { const t = atmOf(data, row); kit.map.flyTo({ center: [t.lng, t.lat], zoom: Math.max(kit.map.getZoom(), 15) }); show(t); } }
    else if (b.id === "m-me") {
      if (!navigator.geolocation) return toast("Браузер не даёт геопозицию");
      navigator.geolocation.getCurrentPosition((p) => {
        if (gone || !kit) return;
        me = [p.coords.longitude, p.coords.latitude];
        new kit.gl.Marker({ color: "#2d5bff" }).setLngLat(me).addTo(kit.map);
        kit.map.flyTo({ center: me, zoom: 14 });
      }, () => toast("Разрешите доступ к геопозиции в браузере"), { enableHighAccuracy: true, timeout: 8000 });
    }
  });
  $("#m-bank", root).addEventListener("change", (e) => { if (!data) return; bank = e.target.value; apply(); if (kit && !me) kit.map.flyTo({ center: TASHKENT, zoom: bank ? 10.5 : 11.5 }); });

  return () => { gone = true; popup?.remove(); kit?.remove(); };
}
