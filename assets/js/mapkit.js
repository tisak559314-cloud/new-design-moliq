// Карта банкоматов: MapLibre подгружается только там, где карта есть на экране.
const VER = "4.7.1";
const STYLE = "https://tiles.openfreemap.org/styles/positron";
export const TASHKENT = [69.2797, 41.3111];
export const FLAG_BITS = { cashOut: 1, cashIn: 2, fx: 4 | 8, h24: 16 };
export const SYSTEMS = ["Uzcard", "Humo", "Visa", "Mastercard", "UnionPay", "МИР"];

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
  const gl = await loadMapLibre();
  const map = new gl.Map({ container: el, style: STYLE, center: opts.center || TASHKENT, zoom: opts.zoom ?? 11, interactive: opts.interactive !== false, attributionControl: { compact: true }, cooperativeGestures: false });
  let filter = opts.filter || {};
  await new Promise((res) => map.once("load", res));
  map.addSource("atms", { type: "geojson", data: toGeo(data, filter) });
  map.addLayer({ id: "atm-dots", type: "circle", source: "atms", maxzoom: 13.5, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 1.6, 10, 3.2, 13.5, 6], "circle-color": ["get", "c"], "circle-stroke-color": "#fff", "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 0, 11, 1] } });
  map.addLayer({ id: "atm-pins", type: "symbol", source: "atms", minzoom: 13.5, layout: { "icon-image": ["get", "i"], "icon-size": ["interpolate", ["linear"], ["zoom"], 13.5, 0.42, 16, 0.62], "icon-allow-overlap": true } });
  // значки банков догружаются, точки видны сразу
  data.banks.forEach(async (b, i) => {
    if (!b.icon) return;
    const px = await bankPin(`assets/banks/${b.icon}`);
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
