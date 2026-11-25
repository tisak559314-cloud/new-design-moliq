// Общие помощники: экранирование, числа, значки, наклейки.

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** Ссылка из данных банков: пускаем только http(s) */
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? esc(u) : "#");
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
/** 1 045 300 */
export const fmt = (n) => nf.format(Math.round(n));
/** 12 004,48 */
export const fmt2 = (n) => nf2.format(n);
const trim1 = (x) => String(Math.round(x * 10) / 10).replace(".", ",");
/** 20 млн · 1,5 млрд · 500 тыс. */
export function short(n) {
  if (n == null) return "";
  if (n >= 1e9) return `${trim1(n / 1e9)} млрд`;
  if (n >= 1e6) return `${trim1(n / 1e6)} млн`;
  if (n >= 1e3) return `${trim1(n / 1e3)} тыс.`;
  return fmt(n);
}
export const pct = (r) => `${String(Math.round(r * 100) / 100).replace(".", ",")}%`;
export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  return forms[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
}
/** 18 мес. · 2 года · 15 лет */
export function term(m) {
  if (m >= 24 && m % 12 === 0) { const y = m / 12; return `${y} ${plural(y, ["год", "года", "лет"])}`; }
  if (m === 12) return "1 год";
  return `${m} мес.`;
}
export const CUR = { UZS: "сум", USD: "$", EUR: "€", RUB: "₽" };
export const money = (n, cur = "UZS") => (cur === "UZS" ? `${fmt(n)} сум` : `${fmt(n)} ${CUR[cur] || cur}`);

/** Аннуитетный платёж */
export function annuity(p, rateYear, n) {
  if (p <= 0 || n <= 0) return 0;
  const r = rateYear / 100 / 12;
  return r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
}
/** Сумма, которую можно взять при платеже pay */
export function principal(pay, rateYear, n) {
  if (pay <= 0 || n <= 0) return 0;
  const r = rateYear / 100 / 12;
  return r === 0 ? pay * n : (pay * (1 - Math.pow(1 + r, -n))) / r;
}
export const median = (xs) => { const a = [...xs].sort((x, y) => x - y); const m = a.length >> 1; return a.length ? (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2) : 0; };

/** Поле суммы: «20 000 000», курсор не прыгает */
export function moneyInput(input, onChange) {
  const digits = (s) => s.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13);
  const paint = (d) => (d ? fmt(Number(d)) : "");
  input.addEventListener("input", () => {
    const before = digits(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    const d = digits(input.value);
    input.value = paint(d);
    let pos = 0, seen = 0;
    while (pos < input.value.length && seen < before) { if (/\d/.test(input.value[pos])) seen++; pos++; }
    try { input.setSelectionRange(pos, pos); } catch { /* тип поля не поддерживает */ }
    onChange(d ? Number(d) : null);
  });
  return { set: (n) => { input.value = n ? fmt(n) : ""; } };
}

const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ext: '<path d="M9 7h8v8M17 7 7 17"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  filter: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
  sort: '<path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  chat: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z"/>',
  credit: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/>',
  deposit: '<rect x="4" y="4" width="16" height="15" rx="3"/><circle cx="12" cy="11.5" r="3"/><path d="M12 8.5V7M7.5 19v1.5M16.5 19v1.5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 14.5h3"/>',
  fx: '<path d="M4 9h15M15 5l4 4-4 4M20 15H5M9 11l-4 4 4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  locate: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21"/>',
  bank: '<path d="M4 10 12 4l8 6M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3 20h18"/>',
  spark: '<path d="M12 4l1.9 5.1L19 11l-5.1 1.9L12 18l-1.9-5.1L5 11l5.1-1.9L12 4z"/>',
  gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 14 3.5-4.5"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5"/>',
  scale: '<path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a2.8 2.8 0 0 0 5 0L5 8zM19 8l-2.5 6a2.8 2.8 0 0 0 5 0L19 8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 3.8 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.6l-5.01 2.65.96-5.6L3.9 9.7l5.6-.8L12 3.8z"/>',
  stock: '<path d="M4 19h16"/><path d="m5 15 4.5-4.5 3.5 3L19 7.5"/><path d="M15 7.5h4v4"/>',
  minus: '<path d="M5 12h14"/>',
};
export const icon = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`;

const FLAGS = {
  ru: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><rect y="5.33" width="22" height="5.34" fill="#1c3fb0"/><rect y="10.67" width="22" height="5.33" fill="#d52b1e"/></svg>',
  uz: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><rect width="22" height="5" fill="#0099b5"/><rect y="11" width="22" height="5" fill="#1eb53a"/><rect y="5" width="22" height=".6" fill="#ce1126"/><rect y="10.4" width="22" height=".6" fill="#ce1126"/><circle cx="4.2" cy="2.5" r="1.5" fill="#fff"/><circle cx="4.8" cy="2.5" r="1.25" fill="#0099b5"/></svg>',
  en: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#1f3a8a"/><path d="M0 0l22 16M22 0 0 16" stroke="#fff" stroke-width="3"/><path d="M0 0l22 16M22 0 0 16" stroke="#c8102e" stroke-width="1.2"/><path d="M11 0v16M0 8h22" stroke="#fff" stroke-width="5"/><path d="M11 0v16M0 8h22" stroke="#c8102e" stroke-width="2.6"/></svg>',
  USD: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><path d="M0 1.2h22M0 3.7h22M0 6.2h22M0 8.6h22M0 11.1h22M0 13.5h22" stroke="#b22234" stroke-width="1.25"/><rect width="10" height="8.6" fill="#3c3b6e"/></svg>',
  EUR: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#1f3a93"/><g fill="#ffcc00"><circle cx="11" cy="3.2" r=".9"/><circle cx="11" cy="12.8" r=".9"/><circle cx="6.2" cy="8" r=".9"/><circle cx="15.8" cy="8" r=".9"/><circle cx="7.6" cy="4.6" r=".9"/><circle cx="14.4" cy="4.6" r=".9"/><circle cx="7.6" cy="11.4" r=".9"/><circle cx="14.4" cy="11.4" r=".9"/></g></svg>',
  RUB: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><rect y="5.33" width="22" height="5.34" fill="#1c3fb0"/><rect y="10.67" width="22" height="5.33" fill="#d52b1e"/></svg>',
  // золото — не флаг, а слиток в той же рамке
  XAU: '<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#f3c63a"/><path d="M0 0h22v5H0z" fill="#ffe487"/><path d="M0 11.5h22V16H0z" fill="#cf9a12"/><rect x="7" y="6.4" width="8" height="3.2" rx=".8" fill="#fff" opacity=".55"/></svg>',
};
export const flag = (code) => `<span class="flag">${FLAGS[code] || ""}</span>`;

// Наклейки Moliq: объём — тёмной подложкой со сдвигом, без свечений
const S = {
  coin: '<svg viewBox="0 0 120 120"><defs><radialGradient id="st-cg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#eaff9c"/><stop offset=".6" stop-color="#c8f24a"/><stop offset="1" stop-color="#8fb81a"/></radialGradient></defs><circle cx="60" cy="64" r="50" fill="#6f8f10"/><circle cx="60" cy="58" r="50" fill="url(#st-cg)" stroke="#0a0b10" stroke-width="3"/><circle cx="60" cy="58" r="38" fill="none" stroke="#0a0b10" stroke-width="2.5" stroke-dasharray="4 6"/><text x="60" y="71" text-anchor="middle" font-family="Onest, sans-serif" font-weight="800" font-size="38" fill="#0a0b10">$</text></svg>',
  card: '<svg viewBox="0 0 160 110"><defs><linearGradient id="st-kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d8bff"/><stop offset="1" stop-color="#1b3fd6"/></linearGradient></defs><rect x="6" y="12" width="148" height="92" rx="16" fill="#0a0b10"/><rect x="6" y="6" width="148" height="92" rx="16" fill="url(#st-kg)" stroke="#0a0b10" stroke-width="3"/><rect x="22" y="30" width="28" height="20" rx="5" fill="#c8f24a" stroke="#0a0b10" stroke-width="2"/><rect x="22" y="66" width="70" height="8" rx="4" fill="#fff" opacity=".85"/><circle cx="118" cy="72" r="12" fill="#ff7ac6" opacity=".95"/><circle cx="132" cy="72" r="12" fill="#c8f24a" opacity=".9"/></svg>',
  pin: '<svg viewBox="0 0 100 130"><ellipse cx="50" cy="122" rx="22" ry="6" fill="#0a0b10" opacity=".25"/><path d="M50 6C27 6 10 23 10 46c0 30 40 70 40 70s40-40 40-70C90 23 73 6 50 6z" fill="#ef4b4b" stroke="#0a0b10" stroke-width="3"/><circle cx="50" cy="45" r="16" fill="#fff" stroke="#0a0b10" stroke-width="3"/><path d="M28 28c5-8 13-12 22-12" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/></svg>',
  percent: '<svg viewBox="0 0 120 126"><path transform="translate(0 6)" d="M60 6l12 10 15-3 5 15 15 6-3 15 10 12-10 12 3 15-15 6-5 15-15-3-12 10-12-10-15 3-5-15-15-6 3-15-10-12 10-12-3-15 15-6 5-15 15 3z" fill="#0a0b10"/><path d="M60 6l12 10 15-3 5 15 15 6-3 15 10 12-10 12 3 15-15 6-5 15-15-3-12 10-12-10-15 3-5-15-15-6 3-15-10-12 10-12-3-15 15-6 5-15 15 3z" fill="#ff7ac6" stroke="#0a0b10" stroke-width="3"/><text x="60" y="75" text-anchor="middle" font-family="Onest, sans-serif" font-weight="800" font-size="40" fill="#0a0b10">%</text></svg>',
  chart: '<svg viewBox="0 0 130 110"><rect x="6" y="12" width="118" height="92" rx="18" fill="#0a0b10"/><rect x="6" y="6" width="118" height="92" rx="18" fill="#fff" stroke="#0a0b10" stroke-width="3"/><rect x="24" y="56" width="16" height="26" rx="4" fill="#d5e0ff"/><rect x="48" y="44" width="16" height="38" rx="4" fill="#6d8bff"/><rect x="72" y="32" width="16" height="50" rx="4" fill="#2d5bff"/><rect x="96" y="22" width="16" height="60" rx="4" fill="#c8f24a" stroke="#0a0b10" stroke-width="2"/></svg>',
  wallet: '<svg viewBox="0 0 170 130"><rect x="10" y="30" width="150" height="96" rx="20" fill="#0a0b10"/><path d="M34 22 118 8a10 10 0 0 1 11.6 8.2L132 30H30l-2-1a6 6 0 0 1 6-7z" fill="#c8f24a" stroke="#0a0b10" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="24" width="150" height="96" rx="20" fill="#2d5bff" stroke="#0a0b10" stroke-width="3"/><path d="M112 58h48v30h-48a15 15 0 0 1 0-30z" fill="#fff" stroke="#0a0b10" stroke-width="3"/><circle cx="118" cy="73" r="6" fill="#c8f24a" stroke="#0a0b10" stroke-width="2.5"/><rect x="28" y="44" width="46" height="8" rx="4" fill="#fff" opacity=".55"/></svg>',
  swap: '<svg viewBox="0 0 130 120"><circle cx="48" cy="52" r="36" fill="#0a0b10" transform="translate(0 6)"/><circle cx="48" cy="52" r="36" fill="#c8f24a" stroke="#0a0b10" stroke-width="3"/><text x="48" y="64" text-anchor="middle" font-family="Onest, sans-serif" font-weight="800" font-size="34" fill="#0a0b10">$</text><circle cx="88" cy="74" r="30" fill="#0a0b10" transform="translate(0 6)"/><circle cx="88" cy="74" r="30" fill="#fff" stroke="#0a0b10" stroke-width="3"/><text x="88" y="83" text-anchor="middle" font-family="Onest, sans-serif" font-weight="800" font-size="20" fill="#0a0b10">сум</text></svg>',
  gold: '<svg viewBox="0 0 150 110"><path d="M22 98h106l-16-48-12-16H50L38 50z" fill="#0a0b10"/><path d="M38 44h74l16 48H22z" fill="#f5c53d" stroke="#0a0b10" stroke-width="3" stroke-linejoin="round"/><path d="M50 28h50l12 16H38z" fill="#ffe487" stroke="#0a0b10" stroke-width="3" stroke-linejoin="round"/><text x="75" y="77" text-anchor="middle" font-family="Onest, sans-serif" font-weight="800" font-size="20" fill="#0a0b10">999,9</text></svg>',
  send: '<svg viewBox="0 0 150 118"><rect x="6" y="14" width="88" height="58" rx="13" fill="#0a0b10"/><rect x="6" y="8" width="88" height="58" rx="13" fill="#2d5bff" stroke="#0a0b10" stroke-width="3"/><rect x="19" y="22" width="22" height="15" rx="4" fill="#fff" stroke="#0a0b10" stroke-width="2"/><rect x="56" y="54" width="88" height="58" rx="13" fill="#0a0b10"/><rect x="56" y="48" width="88" height="58" rx="13" fill="#c8f24a" stroke="#0a0b10" stroke-width="3"/><path d="M80 77h40M108 65l12 12-12 12" stroke="#0a0b10" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
export const sticker = (name) => `<div class="tile-art" aria-hidden="true">${S[name] || ""}</div>`;

export function toast(text) {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2600);
}
