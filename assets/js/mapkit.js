// Карта банкоматов: MapLibre подгружается только там, где карта есть на экране.
const VER = "4.7.1";
const STYLE = "https://tiles.openfreemap.org/styles/positron";
export const TASHKENT = [69.2797, 41.3111];
export const FLAG_BITS = { cashOut: 1, cashIn: 2, fx: 4 | 8, h24: 16 };
export const SYSTEMS = ["Uzcard", "Humo", "Visa", "Mastercard", "UnionPay", "МИР"];

// Подложка — как на moliq.antigradient.uz: стиль OpenFreeMap «Positron», перекрашенный в палитру Moliq, подписи на русском
const P = {
  land: "#eef3ff", residential: "#e3eafa", park: "#d9f0e3", wood: "#cfeadb", water: "#bcd0ff", waterway: "#a8c0fb",
  building: "#d8e1f5", buildingLine: "#cfd9ef", road: "#ffffff", roadCasing: "#d3dcef", motorway: "#f0f9c8", motorwayCasing: "#c9dc79",
  rail: "#cfd7eb", railDash: "#f6f8fe", boundary: "#b4bfdc", label: "#3b3f4c", labelStrong: "#0a0b10", labelMuted: "#6c7182", labelWater: "#2d5bff", halo: "#ffffff",
};
const RU_NAME = ["coalesce", ["get", "name:ru"], ["get", "name"]];
function patchFor(id, type) {
  if (id === "background") return { paint: { "background-color": P.land } };
  if (id === "park") return { paint: { "fill-color": P.park } };
  if (id === "landcover_wood") return { paint: { "fill-color": P.wood } };
  if (id === "water") return { paint: { "fill-color": P.water } };
  if (id === "waterway") return { paint: { "line-color": P.waterway } };
  if (id === "landuse_residential") return { paint: { "fill-color": P.residential } };
  if (id === "building") return { paint: { "fill-color": P.building, "fill-outline-color": P.buildingLine } };
  if (id === "road_area_pier" || id === "road_pier") return type === "fill" ? { paint: { "fill-color": P.land } } : { paint: { "line-color": P.land } };
  if (/motorway.*casing/.test(id)) return { paint: { "line-color": P.motorwayCasing } };
  if (/motorway.*(inner)/.test(id)) return { paint: { "line-color": P.motorway } };
  if (id === "highway_motorway_subtle") return { paint: { "line-color": P.motorwayCasing } };
  if (/casing/.test(id) && type === "line") return { paint: { "line-color": P.roadCasing } };
  if (id === "highway_major_subtle") return { paint: { "line-color": P.roadCasing } };
  if (/^highway_(minor|path|major_inner)$/.test(id)) return { paint: { "line-color": P.road } };
  if (/^railway/.test(id)) return { paint: { "line-color": /dashline/.test(id) ? P.railDash : P.rail } };
  if (/^boundary/.test(id)) return { paint: { "line-color": P.boundary } };
  if (type === "symbol" && !/shield/.test(id)) {
    const color = /^water/.test(id) ? P.labelWater : /^label_(city|country)/.test(id) ? P.labelStrong : /^highway-name/.test(id) ? P.labelMuted : P.label;
    return { paint: { "text-color": color, "text-halo-color": P.halo, "text-halo-width": 1.2 }, layout: { "text-field": RU_NAME } };
  }
  return null;
}
/** Копия стиля, перекрашенная под Moliq */
export function moliqMapStyle(base) {
  return { ...base, layers: base.layers.map((l) => {
    const patch = patchFor(l.id, l.type);
    if (!patch) return l;
    const next = { ...l };
    if (patch.paint) next.paint = { ...l.paint, ...patch.paint };
    if (patch.layout && l.layout?.["text-field"] !== undefined) next.layout = { ...l.layout, ...patch.layout };
    return next;
  }) };
}
let styleReady;
/** Стиль подложки: загружается один раз; не скачался — берём исходный адрес, карта всё равно откроется */
const mapStyle = () => (styleReady ??= fetch(STYLE).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(moliqMapStyle).catch(() => { styleReady = null; return STYLE; }));

let lib;
export function loadMapLibre() {
  return (lib ??= new Promise((res, rej) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `https://unpkg.com/maplibre-gl@${VER}/dist/maplibre-gl.css`;
    document.head.append(css);
    const s = document.createElement("script");
    s.src = `https://unpkg.com/maplibre-gl@${VER}/dist/maplibre-gl.js`;
    s.onload = () => res(window.maplibregl);
    s.onerror = () => { lib = null; rej(new Error("Карта не загрузилась")); };
    document.head.append(s);
  }));
}

/** Строка банкомата из atms.json → объект */
export function atmOf(data, a) {
  const d = a[8] || [];
  return { id: a[0], bank: data.banks[a[1]], lat: a[2], lng: a[3], name: a[4], flags: a[6], sys: a[7], address: d[0] || "", district: d[1] || "", phone: d[4] || "" };
}
/** Подходит ли банкомат под фильтр { bank, sys: [индексы], flags: [ключи FLAG_BITS] } */
export function atmFits(data, a, f) {
  if (f.bank && data.banks[a[1]]?.id !== f.bank) return false;
  for (const s of f.sys || []) if (!(a[7] & (1 << s))) return false;
  for (const k of f.flags || []) if (!(a[6] & FLAG_BITS[k])) return false;
  return true;
}
const toGeo = (data, f) => ({
  type: "FeatureCollection",
  features: data.atms.filter((a) => atmFits(data, a, f)).map((a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a[3], a[2]] }, properties: { id: a[0], b: a[1], c: data.banks[a[1]]?.color || "#0a0b10", i: `b-${a[1]}` } })),
});

/** Значок банка для карты: скруглённый квадрат с белой рамкой */
function bankPin(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = 72, c = document.createElement("canvas");
      c.width = c.height = s;
      const g = c.getContext("2d");
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      rr(2, 2, s - 4, s - 4, 20); g.fillStyle = "#fff"; g.fill();
      g.save(); rr(6, 6, s - 12, s - 12, 16); g.clip(); g.drawImage(img, 6, 6, s - 12, s - 12); g.restore();
      rr(2, 2, s - 4, s - 4, 20); g.strokeStyle = "rgba(10,11,16,.22)"; g.lineWidth = 1.5; g.stroke();
      res(g.getImageData(0, 0, s, s));
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}

/**
 * Карта с банкоматами. opts: { center, zoom, interactive, filter, onPick(atm) }.
 * Возвращает { map, setFilter(f), remove() }.
 */
export async function atmMap(el, data, opts = {}) {
  const [gl, style] = await Promise.all([loadMapLibre(), mapStyle()]);
  const map = new gl.Map({ container: el, style, center: opts.center || TASHKENT, zoom: opts.zoom ?? 11, interactive: opts.interactive !== false, attributionControl: false, cooperativeGestures: false });
  // подпись источников карты — слева внизу (справа внизу кнопка AI-чата) и свёрнута в «i»: текст — по нажатию
  map.addControl(new gl.AttributionControl({ compact: true }), "bottom-left");
  const foldAttrib = () => { const a = el.querySelector(".maplibregl-ctrl-attrib"); if (a) { a.removeAttribute("open"); a.classList.remove("maplibregl-compact-show"); } };
  map.once("load", foldAttrib);
  map.once("idle", foldAttrib);
  let filter = opts.filter || {};
  await new Promise((res) => map.once("load", res));
  map.addSource("atms", { type: "geojson", data: toGeo(data, filter) });
  map.addLayer({ id: "atm-dots", type: "circle", source: "atms", maxzoom: 13.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 1.6, 10, 3.2, 13.5, 6], "circle-color": ["get", "c"], "circle-stroke-color": "#fff", "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 0, 11, 1] } });
  map.addLayer({ id: "atm-pins", type: "symbol", source: "atms", minzoom: 13.5, layout: { "icon-image": ["get", "i"], "icon-size": ["interpolate", ["linear"], ["zoom"], 13.5, 0.42, 16, 0.62], "icon-allow-overlap": true } });
  // значки банков догружаются, точки видны сразу
  data.banks.forEach(async (b, i) => {
    if (!b.icon) return;
    const px = await bankPin(`/assets/banks/${b.icon}`);
    if (px && map.getStyle() && !map.hasImage(`b-${i}`)) map.addImage(`b-${i}`, px, { pixelRatio: 2 });
  });
  if (opts.onPick) {
    for (const id of ["atm-dots", "atm-pins"]) {
      map.on("click", id, (e) => {
        const p = e.features?.[0]?.properties;
        const row = p && data.atms.find((a) => a[0] === p.id);
        if (row) opts.onPick(atmOf(data, row), map, gl);
      });
      map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
    }
  }
  return {
    map, gl,
    setFilter(f) { filter = f; map.getSource("atms")?.setData(toGeo(data, f)); },
    remove() { map.remove(); },
  };
}
export const countAtms = (data, f) => data.atms.reduce((n, a) => n + (atmFits(data, a, f) ? 1 : 0), 0);
export const yandexRoute = (lat, lng, from) => `https://yandex.uz/maps/?rtext=${from ? `${from[0]},${from[1]}` : ""}~${lat},${lng}&rtt=auto`;
