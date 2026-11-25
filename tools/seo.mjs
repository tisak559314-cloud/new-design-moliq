// Заголовки и описания страниц для поиска и превью ссылок (Telegram, соцсети) — на трёх языках, с числами из данных.
// Подключает tools/build.mjs. Заголовок — что на странице, описание — одно-два предложения с цифрами.

const NUM = { ru: "ru-RU", uz: "ru-RU", en: "en-US" };
const fmt = (lang, n) => new Intl.NumberFormat(NUM[lang], { maximumFractionDigits: 0 }).format(Math.round(n));
const dec = (lang, x) => String(Math.round(x * 10) / 10).replace(".", lang === "en" ? "." : ",");
const pct = (lang, r) => `${dec(lang, r)}%`;
const mln = (lang, n) => `${dec(lang, n / 1e6)} ${{ ru: "млн", uz: "mln", en: "mln" }[lang]}`;
const L = (lang, ru, uz, en) => ({ ru, uz, en }[lang]);
const plural = (n, [one, few, many]) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
/** «572 кредита», «34 банков» → «34 банка»: число и слово в нужной форме (для русских текстов) */
const RU = {
  loan: ["кредит", "кредита", "кредитов"], dep: ["вклад", "вклада", "вкладов"], card: ["карта", "карты", "карт"],
  bankG: ["банка", "банков", "банков"], bank: ["банк", "банка", "банков"], atm: ["банкомат", "банкомата", "банкоматов"],
  office: ["отделение", "отделения", "отделений"], offer: ["предложение", "предложения", "предложений"], app: ["приложение", "приложения", "приложений"],
};
const ru = (n, w) => `${fmt("ru", n)} ${plural(n, RU[w])}`;
const en = (n, w) => `${fmt("en", n)} ${w}${n === 1 ? "" : "s"}`;

const LOAN = {
  "": ["Кредиты", "Kreditlar", "Loans"],
  micro: ["Микрозаймы", "Mikroqarzlar", "Microloans"],
  consumer: ["Потребительские кредиты", "Isteʼmol kreditlari", "Consumer loans"],
  auto: ["Автокредиты", "Avtokreditlar", "Car loans"],
  mortgage: ["Ипотека", "Ipoteka", "Mortgages"],
  edu: ["Образовательные кредиты", "Taʼlim kreditlari", "Education loans"],
};
const CUR = { USD: ["доллара", "dollar", "US dollar"], EUR: ["евро", "yevro", "euro"], RUB: ["рубля", "rubl", "Russian rouble"] };

/**
 * Сводка для текстов — один раз на сборку. db — объект из assets/js/data.js после init() (у кредитов есть флаг
 * targeted), extra — { atms, gold, p2p, complaints } как в файлах данных.
 */
export function stats(db, extra) {
  const banksOf = (xs) => new Set(xs.map((x) => x.bankId)).size;
  const p2pApps = extra.p2p?.apps ?? [];
  return {
    loans: db.loans, deps: db.deposits, cards: db.cards, banks: db.banks, banksOf,
    atms: extra.atms.atms.length, offices: extra.atms.offices?.length ?? 0,
    depMax: Math.max(...db.deposits.filter((d) => d.cur === "UZS" && d.rate != null).map((d) => d.rate)),
    cbu: db.rates.cbu, rateBanks: db.rates.rows.length,
    gold5: extra.gold?.bars?.find((b) => b.g === 5)?.sell,
    p2pApps: p2pApps.length,
    // лимит без комиссии между любыми картами (Uzcard ↔ Humo) у самого щедрого приложения
    p2pTop: Math.max(0, ...p2pApps.filter((a) => !a.ownCard).flatMap((a) => a.rules.filter((r) => r.from.length > 1 && r.to.length > 1).map((r) => r.limit))),
    period: extra.complaints?.period,
    stocks: (extra.stocks?.stocks ?? []).filter((s) => s.status !== "gone"),
    issuers: extra.stocks?.issuers?.length ?? 0,
  };
}
/** Цена акции: «12 650», «6,49» */
const px = (lang, p) => (p >= 100 ? fmt(lang, p) : String(Math.round(p * 100) / 100).replace(".", lang === "en" ? "." : ","));
const dmy = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Метатеги страницы: { title, description, noindex? }. path — как в маршрутах сайта (["credits", "micro"]) */
export function meta(S, path, lang) {
  const i = { ru: 0, uz: 1, en: 2 }[lang];
  const brand = " — Moliq";
  switch (path[0] ?? "") {
    case "": return {
      title: L(lang, "Moliq — кредиты, вклады, карты и курсы банков Узбекистана", "Moliq — Oʻzbekiston banklarining kreditlari, omonatlari, kartalari va kurslari", "Moliq — loans, deposits, cards and exchange rates of Uzbekistan’s banks"),
      description: L(lang,
        `Кредиты, вклады и карты ${ru(S.banks.length, "bankG")} Узбекистана в одном месте: ${ru(S.loans.length, "loan")}, ${ru(S.deps.length, "dep")}, ${ru(S.cards.length, "card")}. Курсы валют, золотые слитки ЦБ, переводы без комиссии и ${ru(S.atms, "atm")} на карте.`,
        `Oʻzbekistondagi ${S.banks.length} ta bankning ${fmt(lang, S.loans.length)} ta krediti, ${fmt(lang, S.deps.length)} ta omonati va ${fmt(lang, S.cards.length)} ta kartasini solishtiring. Valyuta kurslari, MB oltin quymalari, komissiyasiz oʻtkazmalar va xaritada ${fmt(lang, S.atms)} ta bankomat.`,
        `Compare ${fmt(lang, S.loans.length)} loans, ${fmt(lang, S.deps.length)} deposits and ${fmt(lang, S.cards.length)} cards from ${S.banks.length} banks in Uzbekistan. Exchange rates, Central Bank gold bars, fee-free transfers and ${fmt(lang, S.atms)} ATMs on the map.`),
    };
    case "credits": {
      // в заголовке — число предложений, а не «ставки от»: самая низкая ставка обычно акция дилера или льготная
      // программа (автокредит «от 1%»), такой заголовок вводил бы в заблуждение
      const type = LOAN[path[1]] ? path[1] : "";
      const xs = S.loans.filter((l) => !type || l.type === type);
      const name = LOAN[type][i], n = xs.length, b = S.banksOf(xs);
      return {
        title: L(lang, `${name} в банках Узбекистана: ${ru(n, "offer")}`, `Oʻzbekiston banklarida ${name.toLowerCase()}: ${fmt(lang, n)} ta taklif`, `${name} in Uzbekistan’s banks: ${fmt(lang, n)} offers`) + brand,
        description: L(lang,
          `Ставки, суммы и сроки ${ru(b, "bankG")}. Введите сумму и срок — покажем платёж и переплату в каждом банке.`,
          `${b} ta bankning stavkalari, summalari va muddatlari. Summa va muddatni kiriting — har bir bankda toʻlov va ortiqcha toʻlovni koʻrsatamiz.`,
          `Rates, amounts and terms from ${b} banks. Enter the amount and term to see the monthly payment and total interest at every bank.`),
      };
    }
    case "deposits": return {
      title: L(lang, `Вклады в банках Узбекистана — до ${pct(lang, S.depMax)} годовых`, `Oʻzbekiston banklarida omonatlar — yillik ${pct(lang, S.depMax)} gacha`, `Deposits in Uzbekistan’s banks — up to ${pct(lang, S.depMax)} a year`) + brand,
      description: L(lang,
        `${ru(S.deps.length, "dep")} в сумах, долларах и евро от ${ru(S.banksOf(S.deps), "bankG")}: ставка, доход на вашу сумму, пополнение и снятие.`,
        `${S.banksOf(S.deps)} ta bankning soʻm, dollar va yevrodagi ${fmt(lang, S.deps.length)} ta omonati: stavka, summangizga daromad, toʻldirish va yechish.`,
        `${fmt(lang, S.deps.length)} deposits in UZS, US dollars and euros from ${S.banksOf(S.deps)} banks: rate, income on your amount, top-ups and withdrawals.`),
    };
    case "cards": return {
      title: L(lang, "Банковские карты Узбекистана — Humo, Uzcard, Visa, Mastercard", "Oʻzbekiston bank kartalari — Humo, Uzcard, Visa, Mastercard", "Bank cards in Uzbekistan — Humo, Uzcard, Visa, Mastercard") + brand,
      description: L(lang,
        `${ru(S.cards.length, "card")} от ${ru(S.banksOf(S.cards), "bankG")}: стоимость выпуска и обслуживания, платёжная система, валюта.`,
        `${S.banksOf(S.cards)} ta bankning ${fmt(lang, S.cards.length)} ta kartasi: chiqarish va xizmat narxi, toʻlov tizimi, valyuta.`,
        `${fmt(lang, S.cards.length)} cards from ${S.banksOf(S.cards)} banks: issue and service fees, payment system and currency.`),
    };
    case "transfers": return {
      title: L(lang, "Переводы с карты на карту без комиссии — Uzcard и Humo", "Kartadan kartaga komissiyasiz oʻtkazmalar — Uzcard va Humo", "Card-to-card transfers with no fee — Uzcard and Humo") + brand,
      description: L(lang,
        `Где перевести без комиссии до ${mln(lang, S.p2pTop)} в месяц: ${ru(S.p2pApps, "app")} с лимитами из тарифов банков и расчёт, как разбить сумму.`,
        `Oyiga ${mln(lang, S.p2pTop)} gacha komissiyasiz qayerda oʻtkazish mumkin: bank tariflaridagi limitlar bilan ${S.p2pApps} ta ilova va summani qanday boʻlish hisobi.`,
        `Where to send up to ${mln(lang, S.p2pTop)} a month with no fee: ${S.p2pApps} apps with limits from bank tariffs and a plan for splitting your amount.`),
    };
    case "rates": {
      if (path[1] === "gold") return {
        title: L(lang, "Золотые слитки ЦБ — цена сегодня, выкуп и где купить", "MB oltin quymalari — bugungi narx, qaytarib olish va qayerdan sotib olish", "Central Bank gold bars — today’s price, buy-back and where to buy") + brand,
        description: L(lang,
          `Слиток 5 г — ${fmt(lang, S.gold5)} сум. Цены продажи и выкупа ЦБ, сколько теряете при продаже, мировая цена и отделения банков, где слитки есть сегодня.`,
          `5 g quyma — ${fmt(lang, S.gold5)} soʻm. MB sotish va qaytarib olish narxlari, sotganda qancha yoʻqotasiz, jahon narxi va bugun quymalar bor bank boʻlimlari.`,
          `A 5 g bar costs ${fmt(lang, S.gold5)} UZS. Central Bank sale and buy-back prices, what you lose when selling, the world price and bank branches with bars in stock today.`),
      };
      const cur = CUR[path[1]] ? path[1] : "USD", name = CUR[cur][i];
      return {
        title: L(lang, `Курс ${name} сегодня в банках Узбекистана`, `Bugungi ${name} kursi Oʻzbekiston banklarida`, `Today’s ${name} rate in Uzbekistan’s banks`) + brand,
        description: L(lang,
          `Курс ЦБ — ${fmt(lang, S.cbu[cur])} сум. Где дешевле купить и дороже продать: курсы ${S.rateBanks} банков, график за 30 дней и калькулятор обмена.`,
          `MB kursi — ${fmt(lang, S.cbu[cur])} soʻm. Qayerda arzonroq sotib olish va qimmatroq sotish mumkin: ${S.rateBanks} ta bank kurslari, 30 kunlik grafik va kalkulyator.`,
          `Central Bank rate: ${fmt(lang, S.cbu[cur])} UZS. Where to buy cheaper and sell higher: rates of ${S.rateBanks} banks, a 30-day chart and an exchange calculator.`),
      };
    }
    case "map": return {
      title: L(lang, "Банкоматы и отделения банков Узбекистана на карте", "Oʻzbekiston banklarining bankomatlari va boʻlimlari xaritada", "ATMs and bank branches in Uzbekistan on the map") + brand,
      description: L(lang,
        `${ru(S.atms, "atm")} и ${ru(S.offices, "office")}: Humo, Uzcard, Visa, круглосуточные, с пополнением и валютой. Маршрут — в Яндекс Картах.`,
        `${fmt(lang, S.atms)} ta bankomat va ${fmt(lang, S.offices)} ta boʻlim: Humo, Uzcard, Visa, kecha-kunduz ishlaydigan, toʻldirish va valyuta bilan. Yoʻnalish — Yandex Xaritalarda.`,
        `${fmt(lang, S.atms)} ATMs and ${fmt(lang, S.offices)} branches: Humo, Uzcard, Visa, 24/7, cash-in and currency. Directions in Yandex Maps.`),
    };
    case "check": return {
      title: L(lang, "Какой кредит мне по силам — расчёт по доходу", "Qaysi kreditga qurbim yetadi — daromad boʻyicha hisob", "What loan can I afford — a calculation by income") + brand,
      description: L(lang,
        "Введите доход — сразу покажем, до какой суммы кредит по силам на каждый срок, какой будет платёж и сколько останется на жизнь.",
        "Daromadingizni kiriting — har bir muddat uchun qancha summagacha kredit olish mumkinligi, toʻlov va qolgan pulni darhol koʻrsatamiz.",
        "Enter your income to see how much you can borrow for each term, the monthly payment and what is left to live on."),
    };
    case "banks":
      if (path[1] === "complaints") return {
        title: L(lang, `Индекс жалоб ЦБ на банки — ${S.period}`, `MB banklar boʻyicha shikoyatlar indeksi — ${S.period}`, `Central Bank complaint index for banks — ${S.period}`) + brand,
        description: L(lang,
          "Первая десятка банков по индексу обращений клиентов Центрального банка Узбекистана: значение и изменение за квартал.",
          "Oʻzbekiston Markaziy banki mijozlar murojaatlari indeksi boʻyicha dastlabki oʻnta bank: qiymat va chorak davomidagi oʻzgarish.",
          "The top ten banks by the Central Bank of Uzbekistan’s customer complaint index: the value and its change over the quarter."),
      };
      return {
        title: L(lang, "Банки Узбекистана — кредиты, вклады, карты", "Oʻzbekiston banklari — kreditlar, omonatlar, kartalar", "Banks of Uzbekistan — loans, deposits and cards") + brand,
        description: L(lang,
          `${ru(S.banks.length, "bank")}: сколько у каждого кредитов, вкладов и карт, курсы валют, банкоматы на карте и индекс жалоб ЦБ.`,
          `${S.banks.length} ta bank: har birida nechta kredit, omonat va karta, valyuta kurslari, xaritadagi bankomatlar va MB shikoyatlar indeksi.`,
          `${S.banks.length} banks: loans, deposits and cards at each, exchange rates, ATMs on the map and the Central Bank complaint index.`),
      };
    case "bank": {
      const b = S.banks.find((x) => x.id === path[1]);
      if (!b) return { title: "Moliq", description: "", noindex: true };
      const n = (xs) => xs.filter((x) => x.bankId === b.id).length;
      return {
        title: L(lang, `${b.name} — кредиты, вклады, карты и курсы`, `${b.name} — kreditlar, omonatlar, kartalar va kurslar`, `${b.name} — loans, deposits, cards and rates`) + brand,
        description: L(lang,
          `${b.name}: ${ru(n(S.loans), "loan")}, ${ru(n(S.deps), "dep")}, ${ru(n(S.cards), "card")}, курсы валют и банкоматы на карте.`,
          `${b.name}: ${n(S.loans)} ta kredit, ${n(S.deps)} ta omonat, ${n(S.cards)} ta karta, valyuta kurslari va xaritadagi bankomatlar.`,
          `${b.name}: ${en(n(S.loans), "loan")}, ${en(n(S.deps), "deposit")}, ${en(n(S.cards), "card")}, exchange rates and ATMs on the map.`),
      };
    }
    case "stocks": {
      if (path[1]) {
        const s = S.stocks.find((x) => x.t === path[1]);
        if (!s) return { title: "Moliq", description: "", noindex: true };
        const last = s.last ? { ru: `Последняя сделка — ${px("ru", s.last.p)} сум (${dmy(s.last.d)}). `, uz: `Soʻnggi bitim — ${px("uz", s.last.p)} soʻm (${dmy(s.last.d)}). `, en: `Last trade: ${px("en", s.last.p)} UZS (${dmy(s.last.d)}). ` }[lang] : "";
        return {
          title: L(lang, `${s.t} — акции ${s.name}: цена и график`, `${s.t} — ${s.name} aksiyalari: narx va grafik`, `${s.t} — ${s.name} shares: price and chart`) + brand,
          description: last + L(lang,
            "Цены сделок на бирже «Тошкент» по дням, оборот, ликвидность по оценке биржи и где купить.",
            "«Toshkent» birjasidagi kunlik bitim narxlari, aylanma, birja bahosidagi likvidlik va qayerdan sotib olish.",
            "Daily trade prices on the Tashkent Stock Exchange, turnover, the exchange’s liquidity rating and where to buy."),
        };
      }
      const n = S.stocks.length;
      return {
        title: L(lang, "Акции Узбекистана — цены на бирже «Тошкент»", "Oʻzbekiston aksiyalari — «Toshkent» birjasidagi narxlar", "Stocks of Uzbekistan — prices on the Tashkent Stock Exchange") + brand,
        description: L(lang,
          `${fmt(lang, n)} ${plural(n, ["бумага", "бумаги", "бумаг"])} на бирже и ${fmt(lang, S.issuers)} акционерных обществ: последние сделки, оборот, ликвидность, графики цен и где купить.`,
          `Birjadagi ${fmt(lang, n)} ta qimmatli qogʻoz va ${fmt(lang, S.issuers)} ta aksiyadorlik jamiyati: soʻnggi bitimlar, aylanma, likvidlik, narx grafiklari va qayerdan sotib olish.`,
          `${fmt(lang, n)} securities on the exchange and ${fmt(lang, S.issuers)} joint-stock companies: last trades, turnover, liquidity, price charts and where to buy.`),
      };
    }
    case "chat": return {
      title: L(lang, "AI-чат", "AI chat", "AI chat") + brand,
      description: L(lang, "Подбор кредита и ответы о курсах, вкладах и банкоматах.", "Kredit tanlash va kurslar, omonatlar, bankomatlar haqida javoblar.", "Loan matching and answers about rates, deposits and ATMs."),
      noindex: true, // пока это заглушка, а не модель — в поиск не отдаём
    };
    default: return { title: "Moliq", description: "", noindex: true };
  }
}
