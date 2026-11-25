// Логотип компании по тикеру акции: у банков — логотипы сайта (assets/banks), у остальных — скачанные с биржи
// (assets/stocks, список пишет tools/stock-logos.mjs). Привилегированная акция берёт логотип своей обыкновенной.
import { STOCK_LOGOS } from "./stock-logos.js";

const BANK_LOGO = {
  SQBN: "sqb", AGBA: "agro", IPTB: "ipoteka", HMKB: "hamkor", IPKY: "ipakyuli", ALKB: "aloqa", TNBN: "turon", TRSB: "trast",
  UNVB: "universal", BRBN: "brb", KPBA: "kapital", MCBA: "mkb", GRBK: "garant", ORFI: "ofb", XKBK: "xalq", INFB: "infin",
  TGBK: "tenge", DRBK: "davr", ASBU: "asaka",
};

/** Адрес логотипа или null — тогда вместо него тикер */
export function stockLogo(t) {
  if (!t) return null;
  const base = t.endsWith("P") ? t.slice(0, -1) : t;
  const bank = BANK_LOGO[t] ?? BANK_LOGO[base];
  if (bank) return `/assets/banks/${bank}-icon.png`;
  const f = STOCK_LOGOS[t] ?? STOCK_LOGOS[base];
  return f ? `/assets/stocks/${f}` : null;
}
