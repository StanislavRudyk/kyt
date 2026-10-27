/* ===== FAQ — Часті питання з accordion (RentCar UA) ===== */

const FAQ_DATA = [
  { q: 'Як забронювати автомобіль?',
    a: 'Оберіть авто, дати й опції та надішліть заявку. Вона отримає статус «очікує підтвердження»; сайт поки не надсилає листи й не підтверджує бронювання автоматично.' },
  { q: 'Які документи потрібні для оренди?',
    a: 'Підтверджений перелік документів і вимоги до водія власник сервісу ще не надав.' },
  { q: 'Який мінімальний вік для оренди?',
    a: 'Вікові обмеження не підтверджені. Значення в тестових даних каталогу не є правилами оренди.' },
  { q: 'Чи можна орендувати авто за кордон?',
    a: 'Правила виїзду за кордон і страхові вимоги ще не визначені в опублікованих умовах.' },
  { q: 'Що робити в разі ДТП або поломки?',
    a: 'Контакт підтримки, години роботи, порядок допомоги та страхове покриття власник не надав. Перед реальною поїздкою ці дані мають бути зазначені в договорі.' },
  { q: 'Чи є знижки на довгострокову оренду?',
    a: 'У калькуляторі закладено 10% від 7 днів і 25% від 30 днів. Це правила поточного програмного розрахунку, а не підтверджені комерційні умови.' },
  { q: 'Який депозит потрібен?',
    a: 'Показані суми депозиту взяті з непідтвердженого каталогу. Сайт не блокує кошти й не приймає оплату.' },
  { q: 'Чи є ліміт кілометрів?',
    a: 'Ліміт пробігу й тариф за перевищення не налаштовані. Їх потрібно підтвердити для кожного авто до приймання реальних заявок.' },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="bg-[#F4F2ED] text-black py-20 md:py-28">
      <div className="w-[90%] max-w-[900px] mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <span className="kicker is-centered text-black/45 mb-5">Питання та відповіді</span>
          <h2 className="font-display uppercase leading-[0.9] text-[44px] md:text-[72px] tracking-[0.005em]">
            Часті питання
          </h2>
        </div>

        <div className="space-y-2">
          {FAQ_DATA.map((item, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className="border border-black/10 rounded overflow-hidden bg-white">
                <button
                  type="button"
                  aria-expanded={openIdx === i}
                  aria-controls={'faq-answer-' + i}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 md:px-8 py-5 md:py-6 text-left hover:bg-black/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg text-black/20 tabular-nums shrink-0">0{i + 1}</span>
                    <span className="font-semibold text-[15px] md:text-base">{item.q}</span>
                  </div>
                  <span className={'shrink-0 w-8 h-8 rounded-full border border-black/15 grid place-items-center transition-all duration-300 ' +
                    (openIdx === i ? 'rotate-45 border-[#78541d] text-[#78541d]' : 'text-black/40')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14" /><path d="M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  id={'faq-answer-' + i}
                  role="region"
                  aria-label={item.q}
                  aria-hidden={openIdx !== i}
                  className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                  style={{ maxHeight: openIdx === i ? '300px' : '0px', opacity: openIdx === i ? 1 : 0 }}
                >
                  <p className="px-6 md:px-8 pb-6 md:pb-8 pl-[62px] md:pl-[72px] text-black/60 text-sm md:text-[15px] leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-black/50 text-sm mb-5">Не знайшли відповідь на своє питання?</p>
          <CTAButton variant="dark" href="Service.html">Подати заявку</CTAButton>
        </div>
      </div>
    </section>
  );
}

window.FAQ = FAQ;
