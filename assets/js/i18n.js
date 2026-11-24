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
  "Платёж до": ["Toʻlov, eng koʻpi", "Payment up to"], "Первый платёж": ["Birinchi toʻlov", "First payment"], "Первый платёж до": ["Birinchi toʻlov, eng koʻpi", "First payment up to"],
  "Платежи": ["Toʻlovlar", "Payments"], "Равные": ["Teng", "Equal"], "Убывающие": ["Kamayib boruvchi", "Decreasing"],
  "Без страховки и комиссий банка — полную стоимость кредита банк покажет до подписания договора.": ["Sugʻurta va bank komissiyalarisiz — kreditning toʻliq qiymatini bank shartnoma imzolanishidan oldin koʻrsatadi.", "Excluding insurance and bank fees — the bank shows the full cost of the loan before you sign."],
  "Государство гарантирует вклады до 200 млн сум в одном банке — большую сумму надёжнее разделить между банками.": ["Davlat bitta bankdagi omonatlarni 200 mln soʻmgacha kafolatlaydi — kattaroq summani banklar oʻrtasida boʻlgan maʼqul.", "The state guarantees deposits up to 200 mln UZS in one bank — it is safer to split a larger amount between banks."], "Переплата до": ["Ortiqcha toʻlov, eng koʻpi", "Overpayment up to"], "Все банки": ["Barcha banklar", "All banks"], "Все": ["Hammasi", "All"],
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
  "Какой кредит": ["Qaysi kredit", "Which loan"], "Ваш доход в месяц": ["Oylik daromadingiz", "Your monthly income"], "Другие кредиты": ["Boshqa kreditlar", "Other loans"], "Кредиты и рассрочки": ["Kreditlar va muddatli toʻlovlar", "Loans and instalments"],
  "Есть": ["Bor", "Yes"], "Плачу по ним в месяц": ["Ular boʻyicha oyiga toʻlayman", "I pay for them monthly"], "Сумма и срок": ["Summa va muddat", "Amount and term"],
  "По желанию": ["Ixtiyoriy", "Optional"], ", сум": [", soʻm", ", UZS"], "Уменьшить": ["Kamaytirish", "Decrease"], "Очистить": ["Tozalash", "Clear"], "Увеличить": ["Koʻpaytirish", "Increase"],
  "Есть ли другие кредиты": ["Boshqa kreditlar bormi", "Do you have other loans"], "Есть ли кредиты или рассрочки": ["Kredit yoki muddatli toʻlov bormi", "Do you have loans or instalments"], "Укажите доход": ["Daromadni kiriting", "Enter your income"],
  "Сразу покажем, какая сумма вам по силам.": ["Qancha summaga qurbingiz yetishini darhol koʻrsatamiz.", "We’ll show right away how much you can afford."],
  "Вам по силам": ["Qurbingiz yetadi", "You can afford"], "По силам только впритык": ["Qurbingiz zoʻrgʻa yetadi", "Affordable only at the limit"],
  "Нажмите на срок — проверим эту сумму.": ["Muddatni bosing — shu summani tekshiramiz.", "Tap a term and we’ll check that amount."],
  "Новый кредит сейчас не по силам": ["Hozir yangi kreditga qurbingiz yetmaydi", "A new loan is not affordable right now"],
  "Дохода не хватает даже на самый маленький платёж.": ["Daromad eng kichik toʻlovga ham yetmaydi.", "Income does not cover even the smallest payment."],
  "Впритык": ["Zoʻrgʻa", "Tight"], "Тяжело": ["Ogʻir", "Too heavy"], "Не по силам": ["Qurb yetmaydi", "Not affordable"],
  // карта
  "Загружаем банкоматы…": ["Bankomatlar yuklanmoqda…", "Loading ATMs…"], "Рядом со мной": ["Yonimda", "Near me"], "Маршрут": ["Yoʻnalish", "Directions"], "Отделения со слитками на карте": ["Quymalar bor boʻlimlar xaritada", "Branches with gold bars on the map"], "Карта банкоматов": ["Bankomatlar xaritasi", "ATM map"],
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
  // переводы без комиссии
  "Переводы": ["Oʻtkazmalar", "Transfers"], "Переводы без комиссии": ["Komissiyasiz oʻtkazmalar", "Transfers with no fee"], "Перевести без комиссии": ["Komissiyasiz oʻtkazish", "Send with no fee"],
  "С карты на карту": ["Kartadan kartaga", "Card to card"], "в месяц в одном приложении": ["oyiga bitta ilovada", "a month in one app"], "С карты": ["Kartadan", "From card"], "На карту": ["Kartaga", "To card"], "Поменять карты местами": ["Kartalar oʻrnini almashtirish", "Swap the cards"],
  "Сколько переводите": ["Qancha oʻtkazasiz", "How much you send"], "С карты любого банка": ["Istalgan bank kartasidan", "From any bank’s card"], "Где комиссии нет": ["Qayerda komissiya yoʻq", "Where there is no fee"],
  "Банки меняют лимиты без предупреждения — перед переводом посмотрите комиссию в приложении.": ["Banklar limitlarni ogohlantirmasdan oʻzgartiradi — oʻtkazishdan oldin ilovada komissiyani koʻring.", "Banks change limits without notice — check the fee in the app before you send."],
  "Без комиссии получится только часть": ["Komissiyasiz faqat bir qismi oʻtadi", "Only part can go with no fee"], "Хватит одного приложения": ["Bitta ilova yetarli", "One app is enough"], "Разбейте перевод на части": ["Oʻtkazmani qismlarga boʻling", "Split the transfer"],
  "Комиссия": ["Komissiya", "Fee"], "Сэкономите": ["Tejaysiz", "You save"], "Остаток": ["Qoldiq", "The rest"], "с комиссией": ["komissiya bilan", "with a fee"], "Сравниваем с комиссией": ["Taqqoslash uchun komissiya:", "Compared with a fee of"],
  "Нужна карта банка": ["Bank kartasi kerak", "Needs this bank’s card"], "Включите пакет Transfer в приложении": ["Ilovada Transfer paketini yoqing", "Turn on the Transfer package in the app"], "Статус «Аъзо»": ["«Aʼzo» maqomi", "“Aʼzo” status"], "Нужна идентификация": ["Identifikatsiya kerak", "Identification required"], "Акция до": ["Aksiya muddati:", "Promo until"],
  "За один перевод до": ["Bir oʻtkazmada", "Per transfer up to"], "Сверх лимита — комиссия со всей суммы перевода": ["Limitdan oshsa — komissiya butun oʻtkazma summasidan", "Above the limit, the fee applies to the whole transfer"],
  "Без комиссии в месяц": ["Oyiga komissiyasiz", "No fee per month"], "Сверх лимита": ["Limitdan ortigʻiga", "Above the limit"], "Проверено": ["Tekshirilgan", "Checked"], "Уже переводил": ["Oʻtkazganman", "I’ve sent already"], "Тариф": ["Tarif", "Tariff"],
  "Сколько уже перевели в этом месяце": ["Shu oyda qancha oʻtkazdingiz", "How much you’ve sent this month"], "Сохранить": ["Saqlash", "Save"],
  "Для таких карт бесплатных переводов не нашли": ["Bunday kartalar uchun bepul oʻtkazma topilmadi", "No free transfers found for these cards"],
  "Поменяйте карты или снимите условие «С карты любого банка»": ["Kartalarni almashtiring yoki «Istalgan bank kartasidan» shartini olib tashlang", "Change the cards or turn off “From any bank’s card”"],
  "Тарифы не загрузились": ["Tariflar yuklanmadi", "Tariffs did not load"], "Обновите страницу": ["Sahifani yangilang", "Reload the page"],
  // золото
  "Золото": ["Oltin", "Gold"], "Золотые слитки": ["Oltin quymalar", "Gold bars"], "Купить золото": ["Oltin sotib olish", "Buy gold"], "Слитки Центрального банка": ["Markaziy bank quymalari", "Central Bank bars"], "Слиток": ["Quyma", "Bar"],
  "Вес слитка": ["Quyma vazni", "Bar weight"], "Мой слиток": ["Mening quymam", "My bar"], "Сколько заплатили": ["Qancha toʻlagansiz", "How much you paid"], "Купить в банке": ["Bankdan sotib olish", "Buy at a bank"],
  "Банк выкупит": ["Bank qaytarib oladi", "Bank buys back"], "в целой упаковке": ["butun qadoqda", "in intact packaging"], "Повреждённая упаковка": ["Shikastlangan qadoq", "Damaged packaging"], "после экспертизы": ["ekspertizadan soʻng", "after examination"],
  "Если продать сразу, потеряете": ["Darhol sotsangiz, yoʻqotasiz", "Sell right away and you lose"], "Банк выкупит сегодня": ["Bank bugun qaytarib oladi", "Bank buys back today"],
  "Вы в плюсе на": ["Foydangiz:", "You are up by"], "Вы в минусе на": ["Zararingiz:", "You are down by"], "целая упаковка": ["butun qadoq", "intact packaging"],
  "1 г в слитке ЦБ": ["MB quymasida 1 g", "1 g in a CB bar"], "1 г на мировом рынке": ["Jahon bozorida 1 g", "1 g on the world market"], "Наценка ЦБ к мировой цене": ["MB ustamasi (jahon narxiga nisbatan)", "CB markup over the world price"],
  "Где есть слитки": ["Quymalar qayerda bor", "Where bars are in stock"], "Область": ["Viloyat", "Region"], "Любой вес": ["Istalgan vazn", "Any weight"], "Остатки на": ["Qoldiqlar sanasi:", "Stock as of"],
  "Центральный банк": ["Markaziy bank", "Central Bank"], "Найти на карте": ["Xaritadan topish", "Find on the map"], "Таких слитков здесь сегодня нет": ["Bugun bu yerda bunday quymalar yoʻq", "No such bars here today"],
  "Выберите другой вес или область": ["Boshqa vazn yoki viloyatni tanlang", "Choose another weight or region"], "Цены слитков не загрузились": ["Quyma narxlari yuklanmadi", "Bar prices did not load"], "Цена слитка по дням": ["Quyma narxi kunlar boʻyicha", "Bar price by day"],
  "город Ташкент": ["Toshkent shahri", "Tashkent city"], "Ташкентская область": ["Toshkent viloyati", "Tashkent region"], "Республика Каракалпакстан": ["Qoraqalpogʻiston Respublikasi", "Republic of Karakalpakstan"],
  "Андижанская область": ["Andijon viloyati", "Andijan region"], "Бухарская область": ["Buxoro viloyati", "Bukhara region"], "Джизакская область": ["Jizzax viloyati", "Jizzakh region"],
  "Кашкадарьинская область": ["Qashqadaryo viloyati", "Kashkadarya region"], "Наманганская область": ["Namangan viloyati", "Namangan region"], "Навоийская область": ["Navoiy viloyati", "Navoi region"],
  "Самаркандская область": ["Samarqand viloyati", "Samarkand region"], "Сырдарьинская область": ["Sirdaryo viloyati", "Syrdarya region"], "Сурхандарьинская область": ["Surxondaryo viloyati", "Surkhandarya region"],
  "Ферганская область": ["Fargʻona viloyati", "Fergana region"], "Хорезмская область": ["Xorazm viloyati", "Khorezm region"],
  // индекс жалоб
  "Страница не найдена": ["Sahifa topilmadi", "Page not found"], "Возможно, ссылка устарела": ["Havola eskirgan boʻlishi mumkin", "The link may be out of date"],
  "На главную": ["Bosh sahifaga", "Go to home"], "Проверьте интернет и обновите страницу.": ["Internetni tekshiring va sahifani yangilang.", "Check your connection and reload the page."],
  "Отделение": ["Boʻlim", "Branch"],
  "Раздел": ["Boʻlim", "Section"], "Индекс жалоб": ["Shikoyatlar indeksi", "Complaint index"], "Индекс жалоб ЦБ": ["MB shikoyatlar indeksi", "CB complaint index"], "Выше 1": ["1 dan yuqori", "Above 1"],
  "— на банк жалуются чаще, чем у него клиентов": ["— bank ustidan shikoyatlar ulushi mijozlari ulushidan katta", "— the bank’s share of complaints exceeds its share of customers"], "новый в списке": ["roʻyxatda yangi", "new in the list"],
  "Всего жалоб в ЦБ:": ["MBga tushgan jami shikoyatlar:", "Complaints to the CB in total:"], "ЦБ называет первые десять банков и не считает индекс, если жалоб меньше ста.": ["MB dastlabki oʻnta bankni eʼlon qiladi; shikoyatlar yuztadan kam boʻlsa, indeks hisoblanmaydi.", "The CB names the first ten banks and does not compute the index below one hundred complaints."],
  "Публикация ЦБ": ["MB eʼloni", "CB publication"], "Индекс не загрузился": ["Indeks yuklanmadi", "The index did not load"],
};

// фразы с числом внутри: порядок слов в языках разный, поэтому переводится весь элемент; {0}, {1} — его <b>
const E = {
  "hint-loans": ["{0} ta taklif, {1} ta bank", "{0} offers from {1} banks"],
  "hint-dep": ["yillik {0} gacha", "up to {0} a year"],
  "hint-p2p": ["bitta ilovada oyiga {0} gacha", "up to {0} a month in one app"],
  "hint-gold": ["{0} g quyma — {1} soʻm", "A {0} g bar — {1} UZS"],
};

const UNITS = [
  [/(\d) ?млрд/g, ["$1 mlrd", "$1 bln"]], [/(\d) ?млн/g, ["$1 mln", "$1 mln"]], [/(\d) ?тыс\./g, ["$1 ming", "$1K"]], [/сум/g, ["soʻm", "UZS"]], [/мес\./g, ["oy", "mo."]],
  [/\b1 год/g, ["1 yil", "1 year"]], [/(\d) (?:года|лет)/g, ["$1 yil", "$1 years"]], [/(\d) км/g, ["$1 km", "$1 km"]], [/(\d) г(?=$|[\s,])/g, ["$1 g", "$1 g"]], [/шт\./g, ["dona", "pcs"]], [/(\d) м$/g, ["$1 m", "$1 m"]], [/в год/g, ["yiliga", "a year"]],
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
  [new RegExp(`^(\\d+) (?:перевод|перевода|переводов) по ${V}$`), (m, u) => `${m[1]} ta oʻtkazma, har biri ${u(m[2])}`, (m, u) => `${m[1]} transfers of ${u(m[2])}`],
  [new RegExp(`^${V}: выберите срок$`), (m, u) => `${u(m[1])}: muddatni tanlang`, (m, u) => `${u(m[1])}: choose a term`],
  [new RegExp(`^На этот срок спокойно — до ${V}\\.$`), (m, u) => `Bu muddatga xotirjam — ${u(m[1])} gacha.`, (m, u) => `For this term, comfortably up to ${u(m[1])}.`],
  [new RegExp(`^По силам до ${V}$`), (m, u) => `${u(m[1])} gacha qurbingiz yetadi`, (m, u) => `Affordable up to ${u(m[1])}`],
  [new RegExp(`^(По силам|Впритык|Тяжело) · платёж ${V}$`), (m, u, t) => `${t(m[1])} · toʻlov ${u(m[2])}`, (m, u, t) => `${t(m[1])} · payment ${u(m[2])}`],
  [/^Кредиты и рассрочки уже забирают (\d+)% дохода\.$/, (m) => `Kreditlar va muddatli toʻlovlar daromadning ${m[1]}% ini olib qoʻymoqda.`, (m) => `Loans and instalments already take ${m[1]}% of income.`],
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
  [/^цена ЦБ на ([\d.]+)$/, (m) => `MB narxi, ${m[1]}`, (m) => `CB price on ${m[1]}`],
  [/^([\d,]+%) цены$/, (m) => `narxning ${m[1]}`, (m) => `${m[1]} of the price`],
  [/^(\d+) (?:день|дня|дней)$/, (m) => `${m[1]} kun`, (m) => `${m[1]} ${en1(m[1], "day", "days")}`],
  [/^([\d ,]+) \$ за унцию$/, (m) => `unsiyasi ${m[1]} $`, (m) => `$${m[1]} per ounce`],
  [/^Цена слитка по дням: от ([\d ]+) до ([\d ]+)$/, (m) => `Quyma narxi: ${m[1]} dan ${m[2]} gacha`, (m) => `Bar price: from ${m[1]} to ${m[2]}`],
  [/^(I|II|III|IV) квартал (\d{4})$/, (m) => `${m[2]}-yil ${m[1]} chorak`, (m) => `Q${["I", "II", "III", "IV"].indexOf(m[1]) + 1} ${m[2]}`],
  [new RegExp(`^Осталось ${V} из ${V}$`), (m, u) => `${u(m[2])} dan ${u(m[1])} qoldi`, (m, u) => `${u(m[1])} of ${u(m[2])} left`],
  [/^(\d+) из (\d+)$/, (m) => `${m[2]} tadan ${m[1]} ta`, (m) => `${m[1]} of ${m[2]}`],
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
  // атрибут читаем напрямую, а не через dataset: так работает и при сборке страниц (linkedom путает «i18n» с цифрами)
  const key = node.getAttribute("data-i18n");
  if (key && E[key]) {
    if (node.getAttribute("data-i18n-done") !== lang) {
      // числа с единицами внутри <b> («10 млн») переводим до подстановки в шаблон
      const parts = [...node.querySelectorAll("b")].map((b) => { for (const c of b.childNodes) walk(c); return b.outerHTML; });
      node.setAttribute("data-i18n-done", lang);
      node.innerHTML = E[key][idx()].replace(/\{(\d)\}/g, (_, i) => parts[+i] || "");
    }
    return;
  }
  for (const a of ATTRS) if (node.hasAttribute?.(a)) { const v = tr(node.getAttribute(a)); if (v !== node.getAttribute(a)) node.setAttribute(a, v); }
  for (const c of node.childNodes) walk(c);
}

/** Включить язык: ru — как в шаблонах; uz и en — словарь поверх готовой страницы */
/** Перевести готовый узел на текущий язык (для сборки страниц: там нет наблюдателя за изменениями) */
export const translateTree = (node) => { if (lang !== "ru") walk(node); };

const OPTS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
/** Включить язык: ru — как в шаблонах; uz и en — словарь поверх готовой страницы */
export function setLang(next) {
  lang = ["uz", "en"].includes(next) ? next : "ru";
  document.documentElement.lang = lang;
  observer?.disconnect();
  observer = null;
  if (lang === "ru") return;
  walk(document.body);
  if (typeof MutationObserver !== "function") return;
  observer = new MutationObserver((list) => {
    // свой перевод не должен снова будить наблюдателя: отключаемся на время правок
    observer.disconnect();
    try {
      for (const m of list) {
        if (m.type === "characterData") walk(m.target);
        else if (m.type === "attributes") { const v = tr(m.target.getAttribute(m.attributeName)); if (v != null && v !== m.target.getAttribute(m.attributeName)) m.target.setAttribute(m.attributeName, v); }
        else for (const n of m.addedNodes) walk(n);
      }
    } finally { observer.observe(document.body, OPTS); }
  });
  observer.observe(document.body, OPTS);
}
