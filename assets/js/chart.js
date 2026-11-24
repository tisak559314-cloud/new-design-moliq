// График по дням: линия с заливкой, отвечает на курсор, палец и стрелки клавиатуры.
import { $, esc } from "./lib.js";

const CH = { W: 600, H: 120, pad: 6 };
const dateRu = (iso) => { const [y, m, d] = String(iso || "").split("-"); return d ? `${d}.${m}.${y}` : ""; };

/** Положение точки на графике в долях ширины и высоты */
function scale(pts) {
  const vals = pts.map((p) => p.v), min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  return { min, max, x: (i) => i / (pts.length - 1), y: (v) => (CH.pad + (1 - (v - min) / span) * (CH.H - CH.pad * 2)) / CH.H };
}

/**
 * Разметка графика. pts — [{ d: "ГГГГ-ММ-ДД", v }], не меньше двух точек (иначе пустая строка).
 * label — подпись для экранного диктора без чисел («Курс ЦБ за 30 дней»), caption — слева под графиком, f — как писать число.
 */
export function chartHtml(pts, { label, caption, f }) {
  if (pts.length < 2) return "";
  const { W, H } = CH, sc = scale(pts);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${(sc.x(i) * W).toFixed(1)} ${(sc.y(p.v) * H).toFixed(1)}`).join(" ");
  return `<figure>
    <div class="chart-box" id="chart" tabindex="0" role="group" aria-label="${esc(label)}: от ${f(sc.min)} до ${f(sc.max)}">
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${line} L${W} ${H} L0 ${H} Z"/><path class="l" d="${line}" vector-effect="non-scaling-stroke"/></svg>
      <i class="chart-line" hidden></i><i class="chart-dot" hidden></i>
      <div class="chart-tip" role="status" hidden></div>
    </div>
    <figcaption class="cap num" style="display:flex;justify-content:space-between;margin-top:6px"><span>${esc(caption)}</span><span>${f(sc.min)} – ${f(sc.max)}</span></figcaption></figure>`;
}

/**
 * Подсказка над точкой: дата, значение в этот день и на сколько оно выше или ниже сегодняшнего (today).
 */
export function bindChart(box, pts, today, f) {
  if (!box || pts.length < 2) return;
  const line = $(".chart-line", box), dot = $(".chart-dot", box), tip = $(".chart-tip", box), sc = scale(pts);
  let at = -1;
  const hide = () => { at = -1; line.hidden = dot.hidden = tip.hidden = true; };
  const show = (i) => {
    i = Math.max(0, Math.min(pts.length - 1, i));
    if (i === at) return;
    at = i;
    const p = pts[i], x = sc.x(i) * 100, y = sc.y(p.v) * 100, diff = p.v - today;
    const delta = Math.abs(diff) < 0.005 ? `<span class="delta flat">как сегодня</span>`
      : `<span class="delta ${diff > 0 ? "up" : "down"}"><span class="num">${diff > 0 ? "▲" : "▼"} ${f(Math.abs(diff))}</span><span>${diff > 0 ? "выше, чем сегодня" : "ниже, чем сегодня"}</span></span>`;
    tip.innerHTML = `<span class="cap num">${esc(dateRu(p.d))}</span><b class="num">${f(p.v)} сум</b>${delta}`;
    line.hidden = dot.hidden = tip.hidden = false;
    line.style.left = dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    // подсказка — над точкой и не вылезает за края графика
    const half = tip.offsetWidth / 2, w = box.clientWidth, px = (x / 100) * w;
    tip.style.left = `${Math.max(half, Math.min(w - half, px))}px`;
    tip.style.top = `${(y / 100) * box.clientHeight}px`;
  };
  const point = (e) => { const r = box.getBoundingClientRect(); show(Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1))); };
  box.addEventListener("pointermove", point);
  box.addEventListener("pointerdown", point);
  // мышь ушла — убираем; после касания пальцем подсказка остаётся, пока не коснутся в другом месте
  box.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
  box.addEventListener("blur", hide);
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); show((at < 0 ? pts.length - 1 : at) + (e.key === "ArrowLeft" ? -1 : 1)); }
    else if (e.key === "Escape") hide();
  });
}
