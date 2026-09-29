"""All user-facing strings in Armenian (hy), Russian (ru), English (en)."""

LANGS = {"hy": "Հայերեն", "ru": "Русский", "en": "English"}

T = {
    # --- common ---
    "choose_lang": {
        "hy": "Բարև 👋 Ընտրեք լեզուն / Выберите язык / Choose a language",
        "ru": "Բարև 👋 Ընտրեք լեզուն / Выберите язык / Choose a language",
        "en": "Բարև 👋 Ընտրեք լեզուն / Выберите язык / Choose a language",
    },
    "welcome": {
        "hy": ("Ես Dayak-ն եմ՝ ստուգված դայակների ծառայություն Երևանում։\n\n"
               "✅ Յուրաքանչյուր դայակ անցել է անձնական հարցազրույց\n"
               "✅ Ստուգված է 2 երաշխավորություն\n"
               "✅ Անձնագիրը լուսանկարված է\n"
               "✅ Եթե դայակը հիվանդանա՝ 4 ժամում փոխարինող ենք ուղարկում\n\n"
               "Ի՞նչ եք ուզում անել։"),
        "ru": ("Я Dayak — сервис проверенных нянь в Ереване.\n\n"
               "✅ Каждая няня прошла личное собеседование\n"
               "✅ Проверены 2 рекомендации\n"
               "✅ Паспорт сфотографирован\n"
               "✅ Если няня заболела — замена в течение 4 часов\n\n"
               "Что вы хотите сделать?"),
        "en": ("I'm Dayak — verified nannies in Yerevan.\n\n"
               "✅ Every nanny interviewed in person\n"
               "✅ 2 references checked\n"
               "✅ ID photographed\n"
               "✅ If your nanny is sick, a backup arrives within 4 hours\n\n"
               "What would you like to do?"),
    },
    "btn_find": {"hy": "👶 Դայակ եմ փնտրում", "ru": "👶 Ищу няню", "en": "👶 I need a nanny"},
    "btn_nanny": {"hy": "🙋‍♀️ Ես դայակ եմ", "ru": "🙋‍♀️ Я няня", "en": "🙋‍♀️ I am a nanny"},
    "btn_lang": {"hy": "🌐 Լեզու", "ru": "🌐 Язык", "en": "🌐 Language"},
    "btn_cancel": {"hy": "❌ Չեղարկել", "ru": "❌ Отмена", "en": "❌ Cancel"},
    "btn_skip": {"hy": "⏭ Բաց թողնել", "ru": "⏭ Пропустить", "en": "⏭ Skip"},
    "cancelled": {"hy": "Չեղարկված է։ /start՝ նորից սկսելու համար։",
                  "ru": "Отменено. /start — начать заново.",
                  "en": "Cancelled. /start to begin again."},
    "invalid": {"hy": "Խնդրում եմ ընտրեք տարբերակներից մեկը 🙏",
                "ru": "Пожалуйста, выберите один из вариантов 🙏",
                "en": "Please pick one of the options 🙏"},

    # --- parent flow ---
    "p_age": {"hy": "Երեխայի տարիքը՞ (եթե մի քանիսն են՝ գրեք բոլորը, օր. «2 և 5»)",
              "ru": "Возраст ребёнка? (если несколько — напишите все, напр. «2 и 5»)",
              "en": "Child's age? (if several, list all, e.g. \"2 and 5\")"},
    "p_hours": {"hy": "Ի՞նչ գրաֆիկ է պետք։", "ru": "Какой график нужен?", "en": "What schedule do you need?"},
    "hours_opts": {
        "hy": ["Լրիվ օր (8+ ժ/օր)", "Կես օր (4–5 ժ/օր)", "Երեկոներ / պահանջով", "Շաբաթ-կիրակի"],
        "ru": ["Полный день (8+ ч/день)", "Полдня (4–5 ч/день)", "Вечера / по запросу", "Выходные"],
        "en": ["Full day (8+ h/day)", "Half day (4–5 h/day)", "Evenings / on demand", "Weekends"],
    },
    "p_district": {"hy": "Ո՞ր վարչական շրջանում եք։", "ru": "В каком районе вы живёте?", "en": "Which district are you in?"},
    "districts": {
        "hy": ["Կենտրոն", "Արաբկիր", "Քանաքեռ-Զեյթուն", "Աջափնյակ", "Դավթաշեն", "Նոր Նորք",
               "Էրեբունի", "Շենգավիթ", "Մալաթիա-Սեբաստիա", "Ավան", "Նուբարաշեն", "Նորք-Մարաշ", "Այլ"],
        "ru": ["Кентрон", "Арабкир", "Канакер-Зейтун", "Ачапняк", "Давташен", "Нор Норк",
               "Эребуни", "Шенгавит", "Малатия-Себастия", "Аван", "Нубарашен", "Норк-Мараш", "Другой"],
        "en": ["Kentron", "Arabkir", "Kanaker-Zeytun", "Ajapnyak", "Davtashen", "Nor Nork",
               "Erebuni", "Shengavit", "Malatia-Sebastia", "Avan", "Nubarashen", "Nork-Marash", "Other"],
    },
    "p_lang": {"hy": "Ի՞նչ լեզվով պետք է դայակը խոսի երեխայի հետ։",
               "ru": "На каком языке няня должна говорить с ребёнком?",
               "en": "Which language should the nanny speak with the child?"},
    "nanny_langs": {
        "hy": ["Հայերեն", "Ռուսերեն", "Անգլերեն", "Հայերեն + Ռուսերեն", "Կարևոր չէ"],
        "ru": ["Армянский", "Русский", "Английский", "Армянский + Русский", "Не важно"],
        "en": ["Armenian", "Russian", "English", "Armenian + Russian", "Doesn't matter"],
    },
    "p_start": {"hy": "Ե՞րբ է պետք սկսել։", "ru": "Когда нужно начать?", "en": "When do you need to start?"},
    "start_opts": {
        "hy": ["Այս շաբաթ", "2 շաբաթվա ընթացքում", "Ամսվա ընթացքում", "Դեռ նայում եմ"],
        "ru": ["На этой неделе", "В течение 2 недель", "В течение месяца", "Пока смотрю"],
        "en": ["This week", "Within 2 weeks", "Within a month", "Just looking"],
    },
    "p_backup": {"hy": "Ձեզ համար որքանո՞վ է կարևոր փոխարինող դայակի երաշխիքը (եթե ձեր դայակը հիվանդանա)։",
                 "ru": "Насколько для вас важна гарантия замены (если няня заболеет)?",
                 "en": "How important is a guaranteed backup nanny (if yours falls sick)?"},
    "backup_opts": {
        "hy": ["Շատ կարևոր է", "Լավ կլիներ", "Կարևոր չէ"],
        "ru": ["Очень важно", "Было бы хорошо", "Не важно"],
        "en": ["Very important", "Nice to have", "Not important"],
    },
    "p_phone": {"hy": "Հեռախոսահամարը՞ (կզանգենք 24 ժամվա ընթացքում)։ Կարող եք սեղմել կոճակը։",
                "ru": "Ваш телефон? (перезвоним в течение 24 часов). Можно нажать кнопку.",
                "en": "Your phone number? (we call back within 24 h). You can tap the button."},
    "btn_share_phone": {"hy": "📱 Կիսվել համարով", "ru": "📱 Поделиться номером", "en": "📱 Share my number"},
    "p_source": {"hy": "Որտեղի՞ց իմացաք մեր մասին։", "ru": "Откуда вы о нас узнали?", "en": "How did you hear about us?"},
    "source_opts": {
        "hy": ["Facebook խումբ", "Telegram չաթ", "Ընկեր / ծանոթ", "Մանկաբույժ / մանկապարտեզ", "Այլ"],
        "ru": ["Facebook-группа", "Telegram-чат", "Друг / знакомый", "Педиатр / детсад", "Другое"],
        "en": ["Facebook group", "Telegram chat", "Friend", "Pediatrician / kindergarten", "Other"],
    },
    "p_notes": {"hy": "Ուզու՞մ եք ինչ-որ բան ավելացնել (հատուկ պահանջներ, բյուջե, այլ)։",
                "ru": "Хотите что-то добавить? (особые требования, бюджет и т.д.)",
                "en": "Anything else? (special requirements, budget, etc.)"},
    "p_done": {
        "hy": ("Շնորհակալություն 🙏 Հայտը ստացվել է (№{id})։\n\n"
               "Մեր համակարգողը կզանգի ձեզ 24 ժամվա ընթացքում՝ 1–2 համապատասխան դայակ առաջարկելու։\n\n"
               "Ինչպե՞ս է աշխատում.\n"
               "1️⃣ Զանգ և ճշտում\n"
               "2️⃣ Ծանոթություն դայակի հետ (անվճար)\n"
               "3️⃣ Փորձնական օրից առաջ՝ 5,000 ֏ ընտրության վճար Idram-ով\n"
               "4️⃣ Եթե դայակը հիվանդանա՝ փոխարինող 4 ժամում"),
        "ru": ("Спасибо 🙏 Заявка получена (№{id}).\n\n"
               "Наш координатор позвонит вам в течение 24 часов и предложит 1–2 подходящих няни.\n\n"
               "Как это работает:\n"
               "1️⃣ Звонок и уточнение\n"
               "2️⃣ Знакомство с няней (бесплатно)\n"
               "3️⃣ Перед пробным днём — 5 000 ֏ за подбор через Idram\n"
               "4️⃣ Если няня заболела — замена в течение 4 часов"),
        "en": ("Thank you 🙏 Request received (#{id}).\n\n"
               "Our coordinator will call you within 24 hours with 1–2 matching nannies.\n\n"
               "How it works:\n"
               "1️⃣ Call and clarify\n"
               "2️⃣ Meet the nanny (free)\n"
               "3️⃣ Before the trial day — 5,000 AMD matching fee via Idram\n"
               "4️⃣ If the nanny is sick — backup within 4 hours"),
    },

    # --- nanny flow ---
    "n_intro": {"hy": "Հիանալի 🙌 Մի քանի հարց, և մեր համակարգողը կզանգի հարցազրույցի համար։",
                "ru": "Отлично 🙌 Несколько вопросов — и наш координатор позвонит для собеседования.",
                "en": "Great 🙌 A few questions, then our coordinator will call to arrange an interview."},
    "n_name": {"hy": "Անուն Ազգանուն։", "ru": "Имя и фамилия:", "en": "Full name:"},
    "n_age": {"hy": "Ձեր տարիքը՞", "ru": "Ваш возраст?", "en": "Your age?"},
    "n_exp": {"hy": "Քանի՞ տարվա փորձ ունեք որպես դայակ։", "ru": "Сколько лет опыта няней?", "en": "Years of experience as a nanny?"},
    "n_ages": {"hy": "Ո՞ր տարիքի երեխաների հետ եք աշխատել (օր. «0–3», «3–7»)։",
               "ru": "С детьми какого возраста работали? (напр. «0–3», «3–7»)",
               "en": "Which age groups have you worked with? (e.g. \"0–3\", \"3–7\")"},
    "n_langs": {"hy": "Ի՞նչ լեզուներով եք խոսում (գրեք բոլորը)։", "ru": "На каких языках говорите? (все)", "en": "Which languages do you speak? (all)"},
    "n_district": {"hy": "Ո՞ր շրջանում եք ապրում։", "ru": "В каком районе живёте?", "en": "Which district do you live in?"},
    "n_hours": {"hy": "Ի՞նչ գրաֆիկով կարող եք աշխատել։", "ru": "Какой график вам подходит?", "en": "Which schedule works for you?"},
    "n_rate": {"hy": "Ձեր ցանկալի վարձատրությունը (֏/ժամ կամ ֏/ամիս)։",
               "ru": "Желаемая оплата (֏/час или ֏/месяц):",
               "en": "Your expected rate (AMD/hour or AMD/month):"},
    "n_backup": {"hy": "Պատրա՞ստ եք երբեմն կարճ ծանուցմամբ (նույն օրը) փոխարինել այլ դայակի՝ լրացուցիչ վճարով։",
                 "ru": "Готовы ли иногда подменять другую няню в тот же день за доплату?",
                 "en": "Would you sometimes cover for another nanny on short notice (same day) for extra pay?"},
    "yn_opts": {"hy": ["Այո", "Ոչ", "Կախված է"], "ru": ["Да", "Нет", "Зависит"], "en": ["Yes", "No", "Depends"]},
    "n_refs": {"hy": "Ունե՞ք 2 ծնող, ովքեր կարող են երաշխավորել ձեզ (կզանգենք նրանց)։",
               "ru": "Есть ли 2 родителя, которые могут вас порекомендовать? (мы им позвоним)",
               "en": "Do you have 2 parents who can give you a reference? (we will call them)"},
    "n_phone": {"hy": "Հեռախոսահամարը՞", "ru": "Ваш телефон?", "en": "Your phone number?"},
    "n_done": {
        "hy": ("Շնորհակալություն 🙏 Գրանցված եք (№{id})։\n\n"
               "Մեր համակարգողը կզանգի 1–2 օրվա ընթացքում՝ հարցազրույցի ժամ նշանակելու։\n"
               "Հարցազրույցին անհրաժեշտ է անձնագիր և 2 երաշխավորի հեռախոսահամար։"),
        "ru": ("Спасибо 🙏 Вы зарегистрированы (№{id}).\n\n"
               "Координатор позвонит в течение 1–2 дней, чтобы назначить собеседование.\n"
               "На собеседование нужен паспорт и телефоны 2 рекомендателей."),
        "en": ("Thank you 🙏 You're registered (#{id}).\n\n"
               "Our coordinator will call within 1–2 days to schedule an interview.\n"
               "Please bring your ID and the phone numbers of 2 references."),
    },
}


def t(key: str, lang: str, **kw) -> str:
    s = T[key].get(lang) or T[key]["en"]
    return s.format(**kw) if kw else s


def opts(key: str, lang: str) -> list[str]:
    return T[key].get(lang) or T[key]["en"]
