// Языки. Шаблоны написаны по-русски; для UZ и EN готовый текст на странице заменяется по словарю.
// Лексика — как в словарях сайта (messages/uz.json, en.json). Названия банков и продуктов, условия из данных Bank.uz не переводятся.

// ключ — русская строка: [узбекский, английский]
const D = {
  // шапка, подвал
  "Кредиты": ["Kreditlar", "Loans"], "Вклады": ["Omonatlar", "Deposits"], "Карты": ["Kartalar", "Cards"], "Курсы валют": ["Valyuta kurslari", "Exchange rates"],
  "Курсы": ["Kurslar", "Rates"], "Банкоматы": ["Bankomatlar", "ATMs"], "Карта": ["Xarita", "Map"], "Что мне по силам": ["Qurbim yetadimi", "What I can afford"],
  "Главная": ["Bosh sahifa", "Home"], "AI-чат": ["AI chat", "AI chat"], "Банки": ["Banklar", "Banks"], "Банк": ["Bank", "Bank"], "Войти": ["Kirish", "Sign in"],
  "Поиск": ["Qidiruv", "Search"], "Разделы": ["Boʻlimlar", "Sections"], "Закрыть": ["Yopish", "Close"], "Источник данных": ["Maʼlumot manbai", "Data source"],
  "Moliq — на главную": ["Moliq — bosh sahifa", "Moliq — home"], "К содержанию": ["Mazmunga oʻtish", "Skip to content"],
  "Moliq — кредиты, вклады, карты и курсы банков Узбекистана": ["Moliq — Oʻzbekiston banklarining kreditlari, omonatlari, kartalari va kurslari", "Moliq — loans, deposits, cards and rates of Uzbekistan’s banks"],
  "Банкоматы на карте": ["Bankomatlar xaritada", "ATMs on the map"],
  // поиск, вход, сравнение
  "Банк, кредит, вклад или карта": ["Bank, kredit, omonat yoki karta", "Bank, loan, deposit or card"], "Часто ищут": ["Koʻp qidiriladi", "Popular"],
  "Микрозаймы": ["Mikroqarzlar", "Microloans"], "Вклады в сумах": ["Soʻmdagi omonatlar", "Deposits in UZS"], "Курс доллара": ["Dollar kursi", "Dollar rate"],
  "Банкоматы рядом": ["Yaqin bankomatlar", "ATMs nearby"], "Все продукты банка": ["Bankning barcha mahsulotlari", "All products of this bank"],
  "Ничего не нашли": ["Hech narsa topilmadi", "Nothing found"], "Попробуйте название банка или продукта": ["Bank yoki mahsulot nomini yozib koʻring", "Try a bank or product name"],
  "Вход": ["Kirish", "Sign in"], "Номер телефона": ["Telefon raqami", "Phone number"], "Получить код": ["Kod olish", "Get code"],
  "Код придёт в SMS. В профиле хранятся ваши расчёты и сравнения.": ["Kod SMS orqali keladi. Profilda hisob-kitob va solishtirishlaringiz saqlanadi.", "The code arrives by SMS. Your profile keeps your calculations and comparisons."],
  "Это макет: вход подключится при переносе на сайт": ["Bu maket: kirish saytga koʻchirilganda ulanadi", "This is a mock-up: sign-in will work once it moves to the site"],
  "Сравнение": ["Solishtirish", "Comparison"], "Сравнить": ["Solishtirish", "Compare"], "Добавьте ещё": ["Yana qoʻshing", "Add one more"], "Очистить сравнение": ["Solishtirishni tozalash", "Clear comparison"],
  "Да": ["Ha", "Yes"], "Нет": ["Yoʻq", "No"],
  // общие слова
  "Ставка": ["Stavka", "Rate"], "Сумма": ["Summa", "Amount"], "Срок": ["Muddat", "Term"], "Обеспечение": ["Taʼminot", "Collateral"], "Оформление": ["Rasmiylashtirish", "How to apply"],
  "Погашение": ["Soʻndirish", "Repayment"], "Минимальная сумма": ["Minimal summa", "Minimum amount"], "Пополнение": ["Toʻldirish", "Top-up"], "Снятие": ["Yechish", "Withdrawal"],
  "Капитализация": ["Kapitallashtirish", "Capitalisation"], "Платёжная система": ["Toʻlov tizimi", "Payment system"], "Валюта": ["Valyuta", "Currency"], "Выпуск": ["Chiqarish", "Issue"],
  "Обслуживание в год": ["Yillik xizmat haqi", "Yearly fee"], "Срок действия": ["Amal qilish muddati", "Valid for"], "Система": ["Tizim", "System"], "Онлайн": ["Onlayn", "Online"],
  "Бесплатно": ["Bepul", "Free"], "Платёж": ["Toʻlov", "Payment"], "Переплата": ["Ortiqcha toʻlov", "Overpayment"], "Платёж в месяц": ["Oylik toʻlov", "Monthly payment"],
  "Платёж до": ["Toʻlov, eng koʻpi", "Payment up to"], "Переплата до": ["Ortiqcha toʻlov, eng koʻpi", "Overpayment up to"], "Все банки": ["Barcha banklar", "All banks"], "Все": ["Hammasi", "All"],
  "Микрозайм": ["Mikroqarz", "Microloan"], "Потребительский": ["Isteʼmol", "Consumer"], "Потребительские": ["Isteʼmol", "Consumer"], "Автокредит": ["Avtokredit", "Auto loan"],
  "Автокредиты": ["Avtokreditlar", "Auto loans"], "Ипотека": ["Ipoteka", "Mortgage"], "Образовательный": ["Taʼlim", "Education"], "Образовательные": ["Taʼlim", "Education"],
  "Кредит": ["Kredit", "Loan"], "Вклад": ["Omonat", "Deposit"], "Круглосуточно": ["Kecha-kunduz", "24/7"], "Обновлено": ["Yangilangan", "Updated"], "Нет данных": ["Maʼlumot yoʻq", "No data"],
  // главная
  "Что вам нужно": ["Sizga nima kerak", "What do you need"], "Взять кредит": ["Kredit olish", "Get a loan"], "Открыть вклад": ["Omonat ochish", "Open a deposit"],
  "Выбрать карту": ["Karta tanlash", "Choose a card"], "Обменять валюту": ["Valyuta almashtirish", "Exchange currency"], "Найти банкомат": ["Bankomat topish", "Find an ATM"],
  "По всему Узбекистану": ["Butun Oʻzbekiston boʻylab", "Across Uzbekistan"], "Какой кредит вам по силам?": ["Qaysi kreditga qurbingiz yetadi?", "Which loan can you afford?"],
  "Проверить": ["Tekshirish", "Check"], "Показать": ["Koʻrsatish", "Show"], "Показать предложения": ["Takliflarni koʻrsatish", "Show offers"], "Быстрый расчёт": ["Tezkor hisob", "Quick calculation"], "Что считаем": ["Nimani hisoblaymiz", "What to calculate"],
  "Введите сумму": ["Summani kiriting", "Enter an amount"], "Выберите срок": ["Muddatni tanlang", "Choose a term"], "Все кредиты": ["Barcha kreditlar", "All loans"], "Все вклады": ["Barcha omonatlar", "All deposits"],
  "Таких предложений нет": ["Bunday takliflar yoʻq", "No such offers"], "Попробуйте другой срок или сумму": ["Boshqa muddat yoki summani sinab koʻring", "Try another term or amount"],
  "Вкладов на такую сумму нет": ["Bunday summaga omonat yoʻq", "No deposits for this amount"], "Доход за год": ["Yillik daromad", "Income per year"],
  "Доллар": ["Dollar", "Dollar"], "Евро": ["Yevro", "Euro"], "Рубль": ["Rubl", "Ruble"], "курс ЦБ": ["MB kursi", "CB rate"], "Купить дешевле": ["Arzonroq olish", "Buy cheaper"], "Продать дороже": ["Qimmatroq sotish", "Sell higher"],
  "без изменений": ["oʻzgarishsiz", "no change"], "Лучшие предложения": ["Eng yaxshi takliflar", "Best offers"], "Вид продукта": ["Mahsulot turi", "Product type"],
  "Вклады в долларах": ["Dollardagi omonatlar", "Dollar deposits"], "Открыть карту": ["Xaritani ochish", "Open map"], "Карта банкоматов Ташкента": ["Toshkent bankomatlari xaritasi", "Map of ATMs in Tashkent"],
  "Спросите Moliq AI": ["Moliq AI dan soʻrang", "Ask Moliq AI"], "Например: какие документы нужны для ипотеки": ["Masalan: ipoteka uchun qanday hujjatlar kerak", "E.g. what documents do I need for a mortgage"],
  "Вопрос помощнику": ["Yordamchiga savol", "Question for the assistant"], "Спросить": ["Soʻrash", "Ask"], "Хочу получить кредит": ["Kredit olmoqchiman", "I want to get a loan"],
  "Где выгоднее купить доллары": ["Dollarni qayerda arzonroq olish mumkin", "Where is it cheaper to buy dollars"], "Вклад с пополнением": ["Toʻldiriladigan omonat", "Deposit with top-up"],
  "Готовые суммы": ["Tayyor summalar", "Quick amounts"],
  // обрывки подсказок в плитках: число стоит отдельным узлом
  "карта": ["ta karta", "card"], "карты": ["ta karta", "cards"], "карт": ["ta karta", "cards"], "Доллар —": ["Dollar —", "Dollar —"],
  "на карте": ["xaritada", "on the map"], "На карте": ["Xaritada", "On the map"], "предложение": ["ta taklif", "offer"], "предложения": ["ta taklif", "offers"], "предложений": ["ta taklif", "offers"],
  "сум": ["soʻm", "UZS"], "сум.": ["soʻm.", "UZS."],
  // каталог
  "Вид кредита": ["Kredit turi", "Loan type"], "Валюта вклада": ["Omonat valyutasi", "Deposit currency"], "В сумах": ["Soʻmda", "In UZS"], "В долларах": ["Dollarda", "In dollars"], "В евро": ["Yevroda", "In euros"],
  "Сколько вам нужно": ["Sizga qancha kerak", "How much do you need"], "Сколько хотите положить": ["Qancha qoʻymoqchisiz", "How much will you deposit"],
  "Любой срок": ["Istalgan muddat", "Any term"], "до года": ["1 yilgacha", "up to a year"], "дольше": ["uzoqroq", "longer"],
  "Сначала ниже ставка": ["Avval past stavka", "Lowest rate first"], "Сначала больше сумма": ["Avval katta summa", "Largest amount first"], "Сначала дольше срок": ["Avval uzoq muddat", "Longest term first"],
  "Сначала выше ставка": ["Avval yuqori stavka", "Highest rate first"], "Сначала меньше взнос": ["Avval kichik badal", "Smallest deposit first"], "Сначала короче срок": ["Avval qisqa muddat", "Shortest term first"],
  "Сначала дешевле выпуск": ["Avval arzon chiqarish", "Cheapest issue first"], "По банкам": ["Banklar boʻyicha", "By bank"], "Сортировка": ["Saralash", "Sort by"],
  "По запросу": ["Soʻrov boʻyicha", "On request"], "Без срока": ["Muddatsiz", "No fixed term"], "Любая": ["Istalgan", "Any"], "Без залога": ["Garovsiz", "No collateral"],
  "Целевая программа": ["Maqsadli dastur", "Targeted programme"], "Целевые программы": ["Maqsadli dasturlar", "Targeted programmes"], "Первый взнос": ["Boshlangʻich toʻlov", "Down payment"],
  "Льготный период": ["Imtiyozli davr", "Grace period"], "Как выдают": ["Qanday beriladi", "How it is paid out"], "Где оформить": ["Qayerda rasmiylashtiriladi", "Where to apply"],
  "Возраст": ["Yosh", "Age"], "Документы": ["Hujjatlar", "Documents"], "Требования": ["Talablar", "Requirements"], "Вид вклада": ["Omonat turi", "Deposit type"],
  "Выплата процентов": ["Foizlar toʻlovi", "Interest payout"], "Досрочное закрытие": ["Muddatidan oldin yopish", "Early closure"], "Без потери процентов": ["Foizlar yoʻqotilmaydi", "Without losing interest"], "Возможно": ["Mumkin", "Available"],
  "выше, чем сегодня": ["bugungidan yuqori", "higher than today"], "ниже, чем сегодня": ["bugungidan past", "lower than today"], "как сегодня": ["bugungidek", "same as today"],
  "Где открыть": ["Qayerda ochiladi", "Where to open"], "Условия": ["Shartlar", "Terms"], "Акция": ["Aksiya", "Promo"], "Условия на Bank.uz": ["Shartlar Bank.uz saytida", "Terms on Bank.uz"],
  "Подробнее": ["Batafsil", "Details"], "В банк": ["Bankka", "To the bank"], "Самая высокая ставка": ["Eng yuqori stavka", "Highest rate"], "Самая низкая ставка": ["Eng past stavka", "Lowest rate"],
  "Бесплатный выпуск": ["Bepul chiqarish", "Free issue"], "Сбросить": ["Tozalash", "Reset"], "Сбросить всё": ["Hammasini tozalash", "Reset everything"],
  "Под такие условия ничего нет": ["Bunday shartlarga mos taklif yoʻq", "Nothing matches these terms"], "Измените сумму, срок или уберите фильтры": ["Summa yoki muddatni oʻzgartiring, filtrlarni olib tashlang", "Change the amount or term, or remove filters"],
  // курсы
  "Доллар США": ["AQSh dollari", "US dollar"], "Российский рубль": ["Rossiya rubli", "Russian ruble"], "Сколько получится": ["Qancha boʻladi", "How much it comes to"], "Что делаете": ["Nima qilasiz", "What you do"],
  "Покупаю": ["Sotib olaman", "I buy"], "Продаю": ["Sotaman", "I sell"], "Заплатите": ["Toʻlaysiz", "You pay"], "Получите": ["Olasiz", "You get"], "Курсы в банках": ["Banklardagi kurslar", "Rates at banks"],
  "Где меняете": ["Qayerda almashtirasiz", "Where you exchange"], "В отделении": ["Boʻlimda", "At a branch"], "В приложении": ["Ilovada", "In the app"], "В банкомате": ["Bankomatda", "At an ATM"],
  "Банк покупает": ["Bank sotib oladi", "Bank buys"], "Банк продаёт": ["Bank sotadi", "Bank sells"], "Банки не публикуют такой курс": ["Banklar bunday kursni eʼlon qilmaydi", "Banks do not publish this rate"],
  "Выберите другой способ обмена": ["Boshqa almashtirish usulini tanlang", "Choose another way to exchange"], "30 дней": ["30 kun", "30 days"],
  // по силам
  "Доход в месяц": ["Oylik daromad", "Monthly income"], "Платежи по другим кредитам в месяц": ["Boshqa kreditlar boʻyicha oylik toʻlovlar", "Monthly payments on other loans"],
  "Нет кредитов — оставьте пустым": ["Kredit boʻlmasa — boʻsh qoldiring", "No loans — leave empty"], "Сколько хотите взять": ["Qancha olmoqchisiz", "How much do you want to borrow"],
  "Здесь появится ответ": ["Javob shu yerda chiqadi", "The answer will appear here"],
  "Считаем по типичной ставке банков. На все кредиты — не больше половины дохода: так банкам велит ЦБ.": ["Banklarning odatiy stavkasi boʻyicha hisoblaymiz. Barcha kreditlarga — daromadning yarmidan koʻp emas: Markaziy bank talabi shunday.", "We use the banks’ typical rate. All loans together take no more than half of income: that is the Central Bank’s rule."],
  "По силам": ["Qurbingiz yetadi", "Affordable"], "По силам, но впритык": ["Qurbingiz yetadi, lekin zoʻrgʻa", "Affordable, but tight"], "Тяжело: банк, скорее всего, откажет": ["Ogʻir: bank rad etishi mumkin", "Too heavy: the bank will likely refuse"],
  "Так пройдёт": ["Shunday oʻtadi", "This will pass"], "Так будет спокойнее": ["Shunday xotirjamroq", "This is more comfortable"], "При таком доходе новый кредит не пройдёт": ["Bunday daromad bilan yangi kredit oʻtmaydi", "With this income a new loan will not pass"],
  "Сначала закройте часть текущих платежей.": ["Avval joriy toʻlovlarning bir qismini yoping.", "Pay off some of your current loans first."], "Платежи по другим кредитам": ["Boshqa kreditlar boʻyicha toʻlovlar", "Payments on other loans"],
  "Останется на жизнь": ["Yashashga qoladi", "Left to live on"],
  "Какой кредит": ["Qaysi kredit", "Which loan"], "Ваш доход в месяц": ["Oylik daromadingiz", "Your monthly income"], "Другие кредиты": ["Boshqa kreditlar", "Other loans"],
  "Есть": ["Bor", "Yes"], "Плачу по ним в месяц": ["Ular boʻyicha oyiga toʻlayman", "I pay for them monthly"], "Сумма и срок": ["Summa va muddat", "Amount and term"],
  "По желанию": ["Ixtiyoriy", "Optional"], ", сум": [", soʻm", ", UZS"], "Уменьшить": ["Kamaytirish", "Decrease"], "Очистить": ["Tozalash", "Clear"], "Увеличить": ["Koʻpaytirish", "Increase"],
  "Есть ли другие кредиты": ["Boshqa kreditlar bormi", "Do you have other loans"], "Укажите доход": ["Daromadni kiriting", "Enter your income"],
  "Сразу покажем, какая сумма вам по силам.": ["Qancha summaga qurbingiz yetishini darhol koʻrsatamiz.", "We’ll show right away how much you can afford."],
  "Вам по силам": ["Qurbingiz yetadi", "You can afford"], "По силам только впритык": ["Qurbingiz zoʻrgʻa yetadi", "Affordable only at the limit"],
  "Нажмите на срок — проверим эту сумму.": ["Muddatni bosing — shu summani tekshiramiz.", "Tap a term and we’ll check that amount."],
  "Новый кредит сейчас не по силам": ["Hozir yangi kreditga qurbingiz yetmaydi", "A new loan is not affordable right now"],
  "Дохода не хватает даже на самый маленький платёж.": ["Daromad eng kichik toʻlovga ham yetmaydi.", "Income does not cover even the smallest payment."],
  "Впритык": ["Zoʻrgʻa", "Tight"], "Тяжело": ["Ogʻir", "Too heavy"], "Не по силам": ["Qurb yetmaydi", "Not affordable"], "Выберите срок": ["Muddatni tanlang", "Choose a term"],
  // карта
  "Загружаем банкоматы…": ["Bankomatlar yuklanmoqda…", "Loading ATMs…"], "Рядом со мной": ["Yonimda", "Near me"], "Маршрут": ["Yoʻnalish", "Directions"], "Карта банкоматов": ["Bankomatlar xaritasi", "ATM map"],
  "Здесь таких банкоматов нет": ["Bu yerda bunday bankomat yoʻq", "No such ATMs here"], "Отодвиньте карту или уберите фильтр": ["Xaritani suring yoki filtrni olib tashlang", "Move the map or remove a filter"],
  "Карта не загрузилась — проверьте интернет": ["Xarita yuklanmadi — internetni tekshiring", "The map did not load — check your connection"], "Браузер не даёт геопозицию": ["Brauzer joylashuvni bermayapti", "The browser does not provide your location"],
  "Разрешите доступ к геопозиции в браузере": ["Brauzerda joylashuvga ruxsat bering", "Allow location access in the browser"], "Не удалось загрузить банкоматы. Обновите страницу.": ["Bankomatlar yuklanmadi. Sahifani yangilang.", "ATMs did not load. Refresh the page."],
  "Банкомат": ["Bankomat", "ATM"],
  // банки
  "Нет предложений на Bank.uz": ["Bank.uz saytida takliflar yoʻq", "No offers on Bank.uz"],
  // чат
  "Чем помочь?": ["Qanday yordam kerak?", "How can I help?"], "Какой вклад самый выгодный": ["Qaysi omonat eng foydali", "Which deposit pays the most"], "Где ближайший банкомат": ["Eng yaqin bankomat qayerda", "Where is the nearest ATM"],
  "Спросите про кредит, вклад, курс или банкомат": ["Kredit, omonat, kurs yoki bankomat haqida soʻrang", "Ask about a loan, deposit, rate or ATM"], "Сообщение": ["Xabar", "Message"], "Отправить": ["Yuborish", "Send"],
  "Отвечает по данным Bank.uz и ЦБ. Решение о кредите принимает банк.": ["Bank.uz va Markaziy bank maʼlumotlari asosida javob beradi. Kredit boʻyicha qarorni bank qabul qiladi.", "Answers from Bank.uz and Central Bank data. The bank decides on the loan."],
  "Подобрать предложения": ["Takliflarni tanlash", "Find offers"], "Курсы всех банков": ["Barcha banklar kurslari", "Rates at all banks"], "Проверить, по силам ли": ["Qurbim yetishini tekshirish", "Check if I can afford it"],
  "Все предложения": ["Barcha takliflar", "All offers"], "От": ["Dan", "From"], "любой суммы": ["istalgan summa", "any amount"], "Курс ЦБ —": ["MB kursi —", "CB rate —"],
  "Самые высокие ставки по вкладам в сумах:": ["Soʻmdagi omonatlar boʻyicha eng yuqori stavkalar:", "Highest rates on deposits in UZS:"],
  "Самые высокие ставки по вкладам в сумах с пополнением:": ["Toʻldiriladigan soʻm omonatlari boʻyicha eng yuqori stavkalar:", "Highest rates on UZS deposits with top-up:"],
  "Покажу банкоматы на карте — можно выбрать банк, карту и «Круглосуточно».": ["Bankomatlarni xaritada koʻrsataman — bank, karta va «Kecha-kunduz»ni tanlash mumkin.", "I’ll show ATMs on the map — you can pick a bank, a card and “24/7”."],
  "В макете я отвечаю на вопросы о кредитах, вкладах, курсах и банкоматах. На сайте здесь отвечает модель Moliq AI.": ["Maketda men kreditlar, omonatlar, kurslar va bankomatlar haqidagi savollarga javob beraman. Saytda bu yerda Moliq AI modeli javob beradi.", "In this mock-up I answer questions about loans, deposits, rates and ATMs. On the site the Moliq AI model answers here."],
  "Платёж и переплата — по верхней границе ставки. Целевые программы в подбор не входят.": ["Toʻlov va ortiqcha toʻlov — stavkaning yuqori chegarasi boʻyicha. Maqsadli dasturlar tanlovga kirmaydi.", "Payment and overpayment use the upper rate. Targeted programmes are not included."],
  "Укажите сумму — и я подберу.": ["Summani kiriting — tanlab beraman.", "Enter the amount and I’ll find offers."], "Укажите срок — и я подберу.": ["Muddatni tanlang — tanlab beraman.", "Choose the term and I’ll find offers."],
  // ошибки
  "Не удалось загрузить данные": ["Maʼlumotlar yuklanmadi", "Could not load the data"], "Обновить": ["Yangilash", "Refresh"],
};

// фразы с числом внутри: порядок слов в языках разный, поэтому переводится весь элемент; {0}, {1} — его <b>
const E = {
  "hint-loans": ["{0} ta taklif, {1} ta bank", "{0} offers from {1} banks"],
  "hint-dep": ["yillik {0} gacha", "up to {0} a year"],
};

const UNITS = [
  [/(\d) ?млрд/g, ["$1 mlrd", "$1 bln"]], [/(\d) ?млн/g, ["$1 mln", "$1 mln"]], [/(\d) ?тыс\./g, ["$1 ming", "$1K"]], [/сум/g, ["soʻm", "UZS"]], [/мес\./g, ["oy", "mo."]],
  [/\b1 год/g, ["1 yil", "1 year"]], [/(\d) (?:года|лет)/g, ["$1 yil", "$1 years"]], [/(\d) км/g, ["$1 km", "$1 km"]], [/(\d) м$/g, ["$1 m", "$1 m"]], [/в год/g, ["yiliga", "a year"]],
];
const VALUE = /^[−\-]?[\s\d.,%–—-]*(?:\d|млн|млрд|тыс\.|сум|мес\.|год|года|лет|км|м|\$|€|₽)[\s\d.,%–—\-а-я.$€₽]*$/i;
const V = "([\\d\\s.,%–-]+(?:\\s?(?:млн|млрд|тыс\\.|сум|мес\\.|год|года|лет|\\$|€|₽))*)";
const en1 = (n, one, many) => (String(n).replace(/\s/g, "") === "1" ? one : many);
const WORDS = { "доход": ["daromad", "income"], "сумму": ["summa", "amount"], "срок": ["muddat", "term"] };

// составные строки: [шаблон, узбекский, английский]; $u1 — группа с переведёнными единицами
const R = [
  [/^(\d[\d ]*) (?:предложение|предложения|предложений)$/, (m) => `${m[1]} ta taklif`, (m) => `${m[1]} ${en1(m[1], "offer", "offers")}`],
  [/^Показать (\d+) (?:предложение|предложения|предложений)$/, (m) => `${m[1]} ta taklifni koʻrsatish`, (m) => `Show ${m[1]} ${en1(m[1], "offer", "offers")}`],
  [/^Показать (\d+) (?:вклад|вклада|вкладов)$/, (m) => `${m[1]} ta omonatni koʻrsatish`, (m) => `Show ${m[1]} ${en1(m[1], "deposit", "deposits")}`],
  [/^Показать ещё (\d+) из (\d+)$/, (m) => `Yana ${m[1]} ta (qolgani ${m[2]})`, (m) => `Show ${m[1]} more of ${m[2]}`],
  [/^Ещё (\d+) от банка$/, (m) => `Bankdan yana ${m[1]} ta`, (m) => `${m[1]} more from this bank`],
  [/^(\d[\d ]*) (?:банкомат|банкомата|банкоматов)$/, (m) => `${m[1]} ta bankomat`, (m) => `${m[1]} ${en1(m[1], "ATM", "ATMs")}`],
  [/^(\d+) (?:кредит|кредита|кредитов)$/, (m) => `${m[1]} ta kredit`, (m) => `${m[1]} ${en1(m[1], "loan", "loans")}`],
  [/^(\d+) (?:вклад|вклада|вкладов)$/, (m) => `${m[1]} ta omonat`, (m) => `${m[1]} ${en1(m[1], "deposit", "deposits")}`],
  [/^(\d+) (?:карта|карты|карт)$/, (m) => `${m[1]} ta karta`, (m) => `${m[1]} ${en1(m[1], "card", "cards")}`],
  [new RegExp(`^Ставка до ${V} годовых$`), (m, u) => `Stavka yillik ${u(m[1])} gacha`, (m, u) => `Rate up to ${u(m[1])} a year`],
  [new RegExp(`^до ${V}$`), (m, u) => `${u(m[1])} gacha`, (m, u) => `up to ${u(m[1])}`],
  [new RegExp(`^от ${V}$`), (m, u) => `${u(m[1])} dan`, (m, u) => `from ${u(m[1])}`],
  [new RegExp(`^${V} на ${V}$`), (m, u) => `${u(m[1])}, ${u(m[2])}ga`, (m, u) => `${u(m[1])} for ${u(m[2])}`],
  [new RegExp(`^На ${V} на ${V}$`), (m, u) => `${u(m[1])}, ${u(m[2])}ga`, (m, u) => `${u(m[1])} for ${u(m[2])}`],
  [new RegExp(`^На ${V}$`), (m, u) => `${u(m[1])} uchun`, (m, u) => `For ${u(m[1])}`],
  [new RegExp(`^Платёж за ${V} на ${V}$`), (m, u) => `${u(m[1])} uchun ${u(m[2])}ga toʻlov`, (m, u) => `Payment for ${u(m[1])} over ${u(m[2])}`],
  [new RegExp(`^Доход за ${V}$`), (m, u) => `${u(m[1])}lik daromad`, (m, u) => `Income over ${u(m[1])}`],
  [new RegExp(`^Срок ${V}$`), (m, u) => `Muddat ${u(m[1])}`, (m, u) => `Term ${u(m[1])}`],
  [new RegExp(`^Сумма ${V}$`), (m, u) => `Summa ${u(m[1])}`, (m, u) => `Amount ${u(m[1])}`],
  [new RegExp(`^\\+${V}$`), (m, u) => `+${u(m[1])}`, (m, u) => `+${u(m[1])}`],
  [new RegExp(`^платёж ${V}$`), (m, u) => `toʻlov ${u(m[1])}`, (m, u) => `payment ${u(m[1])}`],
  [new RegExp(`^${V} в месяц$`), (m, u) => `oyiga ${u(m[1])}`, (m, u) => `${u(m[1])} a month`],
  [new RegExp(`^${V}: выберите срок$`), (m, u) => `${u(m[1])}: muddatni tanlang`, (m, u) => `${u(m[1])}: choose a term`],
  [new RegExp(`^На этот срок спокойно — до ${V}\\.$`), (m, u) => `Bu muddatga xotirjam — ${u(m[1])} gacha.`, (m, u) => `For this term, comfortably up to ${u(m[1])}.`],
  [new RegExp(`^По силам до ${V}$`), (m, u) => `${u(m[1])} gacha qurbingiz yetadi`, (m, u) => `Affordable up to ${u(m[1])}`],
  [new RegExp(`^(По силам|Впритык|Тяжело) · платёж ${V}$`), (m, u, t) => `${t(m[1])} · toʻlov ${u(m[2])}`, (m, u, t) => `${t(m[1])} · payment ${u(m[2])}`],
  [/^Другие кредиты уже забирают (\d+)% дохода\.$/, (m) => `Boshqa kreditlar daromadning ${m[1]}% ini olib qoʻymoqda.`, (m) => `Other loans already take ${m[1]}% of income.`],
  [new RegExp(`^Считаем по типичной ставке ${V}\\. Спокойно — когда на все кредиты уходит до 35% дохода; больше половины банки не дают\\.$`),
    (m, u) => `Odatiy ${u(m[1])} stavka boʻyicha hisoblaymiz. Xotirjam — barcha kreditlarga daromadning 35% igacha ketganda; yarmidan koʻpini banklar bermaydi.`,
    (m, u) => `We use a typical rate of ${u(m[1])}. Comfortable means all loans take up to 35% of income; banks do not allow more than half.`],
  [/^Например, (.+)$/, (m) => `Masalan, ${m[1]}`, (m) => `E.g. ${m[1]}`],
  [/^Обновлено ([\d.]+)$/, (m) => `Yangilangan: ${m[1]}`, (m) => `Updated ${m[1]}`],
  [/^В сравнении: (\d+)$/, (m) => `Solishtirishda: ${m[1]}`, (m) => `In comparison: ${m[1]}`],
  [/^Сравнить можно до (\d+) предложений$/, (m) => `Koʻpi bilan ${m[1]} ta taklifni solishtirish mumkin`, (m) => `You can compare up to ${m[1]} offers`],
  [/^курс ЦБ на ([\d.]+)$/, (m) => `MB kursi, ${m[1]}`, (m) => `CB rate on ${m[1]}`],
  [/^курс ([\d ,]+)$/, (m) => `kurs ${m[1]}`, (m) => `rate ${m[1]}`],
  [/^([▲▼] [\d ,]+) за день$/, (m) => `${m[1]} bir kunda`, (m) => `${m[1]} in a day`],
  [/^Язык: (.+)$/, (m) => `Til: ${m[1]}`, (m) => `Language: ${m[1]}`],
  [/^(.+): курсы банков$/, (m, u, t) => `${t(m[1])}: banklar kurslari`, (m, u, t) => `${t(m[1])}: bank rates`],
  [/^Укажите (.+)$/, (m) => `Kiriting: ${m[1].split(", ").map((w) => WORDS[w]?.[0] || w).join(", ")}`, (m) => `Enter: ${m[1].split(", ").map((w) => WORDS[w]?.[1] || w).join(", ")}`],
  [/^Условия банков и курсы — с Bank\.uz, официальный курс — ЦБ\. Данные на ([\d.]+)\. Решение о выдаче принимает банк\.$/,
    (m) => `Bank shartlari va kurslar — Bank.uz saytidan, rasmiy kurs — Markaziy bankdan. Maʼlumotlar ${m[1]} holatiga. Kredit berish qarorini bank qabul qiladi.`,
    (m) => `Bank terms and rates come from Bank.uz, the official rate from the Central Bank. Data as of ${m[1]}. The bank decides whether to lend.`],
  [new RegExp(`^Платёж посчитан по типичной ставке ${V}\\. На все кредиты банки дают не больше половины дохода — у вас это ${V} в месяц\\.$`),
    (m, u) => `Toʻlov odatiy ${u(m[1])} stavka boʻyicha hisoblangan. Banklar barcha kreditlarga daromadning yarmidan koʻpini bermaydi — sizda bu oyiga ${u(m[2])}.`,
    (m, u) => `The payment uses a typical rate of ${u(m[1])}. Banks allow all loans to take no more than half of income — for you that is ${u(m[2])} a month.`],
  [/^На кредиты уйдёт (\d+)% дохода$/, (m) => `Kreditlarga daromadning ${m[1]}% ketadi`, (m) => `Loans will take ${m[1]}% of income`],
  [/^Дешевле всего купить в (.+) —$/, (m) => `Eng arzon sotib olish — ${m[1]}:`, (m) => `Cheapest to buy at ${m[1]} —`],
  [/^Дороже всего продать в (.+) —$/, (m) => `Eng qimmat sotish — ${m[1]}:`, (m) => `Best place to sell is ${m[1]} —`],
  [/^Нашёл (\d+) (?:предложение|предложения|предложений)\. Три с самой низкой ставкой:$/, (m) => `${m[1]} ta taklif topdim. Eng past stavkali uchtasi:`, (m) => `Found ${m[1]} offers. The three with the lowest rate:`],
  [/^В каталоге (\d+) карт: (.+)$/, (m) => `Katalogda ${m[1]} ta karta: ${m[2]}`, (m) => `The catalogue has ${m[1]} cards: ${m[2]}`],
  [new RegExp(`^На ${V} на ${V} предложений нет\\. Попробуйте другой срок или сумму\\.$`), (m, u) => `${u(m[1])}, ${u(m[2])}ga takliflar yoʻq. Boshqa muddat yoki summani sinab koʻring.`, (m, u) => `No offers for ${u(m[1])} over ${u(m[2])}. Try another term or amount.`],
  [/^Все (\d+)$/, (m) => `Barchasi: ${m[1]}`, (m) => `All ${m[1]}`],
  [/^Курс ЦБ за 30 дней: от ([\d ,]+) до ([\d ,]+)$/, (m) => `MB kursi 30 kunda: ${m[1]} dan ${m[2]} gacha`, (m) => `CB rate over 30 days: from ${m[1]} to ${m[2]}`],
];

let lang = "ru", observer = null;
const idx = () => (lang === "uz" ? 0 : 1);
const units = (s) => UNITS.reduce((acc, [re, to]) => acc.replace(re, to[idx()]), s).trim();

/** Перевод одной строки; null — перевода нет, оставляем как есть */
function one(core) {
  const hit = D[core];
  if (hit) return hit[idx()];
  for (const [re, uz, en] of R) { const m = core.match(re); if (m) return (lang === "uz" ? uz : en)(m, units, (x) => one(x) ?? x); }
  if (VALUE.test(core) && /[а-я]/i.test(core)) return units(core);
  return null;
}
export function tr(text) {
  if (lang === "ru" || !text) return text;
  const core = String(text).replace(/\s+/g, " ").trim();
  if (!core || !/[а-яё]/i.test(core)) return text;
  let out = one(core);
  if (out == null && core.includes(" · ")) { const parts = core.split(" · ").map((p) => one(p)); if (parts.some((p) => p != null)) out = core.split(" · ").map((p, i) => parts[i] ?? p).join(" · "); }
  if (out == null) return text;
  const s = String(text);
  return s.slice(0, s.length - s.trimStart().length) + out + s.slice(s.trimEnd().length);
}

const ATTRS = ["placeholder", "aria-label"];
function walk(node) {
  if (node.nodeType === 3) { const v = tr(node.nodeValue); if (v !== node.nodeValue) node.nodeValue = v; return; }
  if (node.nodeType !== 1 || node.tagName === "SCRIPT" || node.tagName === "STYLE") return;
  const key = node.dataset?.i18n;
  if (key && E[key]) {
    if (node.dataset.i18nDone !== lang) {
      const parts = [...node.querySelectorAll("b")].map((b) => b.outerHTML);
      node.dataset.i18nDone = lang;
      node.innerHTML = E[key][idx()].replace(/\{(\d)\}/g, (_, i) => parts[+i] || "");
    }
    return;
  }
  for (const a of ATTRS) if (node.hasAttribute?.(a)) { const v = tr(node.getAttribute(a)); if (v !== node.getAttribute(a)) node.setAttribute(a, v); }
  for (const c of node.childNodes) walk(c);
}

/** Включить язык: ru — как в шаблонах; uz и en — словарь поверх готовой страницы */
export function setLang(next) {
  lang = ["uz", "en"].includes(next) ? next : "ru";
  document.documentElement.lang = lang;
  observer?.disconnect();
  observer = null;
  if (lang === "ru") return;
  walk(document.body);
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") walk(m.target);
      else if (m.type === "attributes") { const v = tr(m.target.getAttribute(m.attributeName)); if (v != null && v !== m.target.getAttribute(m.attributeName)) m.target.setAttribute(m.attributeName, v); }
      else for (const n of m.addedNodes) walk(n);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
