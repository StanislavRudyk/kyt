/* ===== Умови та договір оренди — сторінка та компонент (RentCar UA) ===== */

const CONTRACT_SECTIONS = [
  {
    id: 'requirements',
    title: '1. Вимоги до водія та документи',
    content: [
      'Вікові вимоги, стаж та перелік документів має підтвердити оператор до публікації. Ця сторінка не перевіряє право на оренду.'
    ]
  },
  {
    id: 'deposit',
    title: '2. Страховий депозит (застава) та оплата',
    content: [
      'Спосіб оплати, сума та повернення застави не підтверджені. Онлайн-оплата не підключена, а депозити в каталозі є неперевіреними значеннями.'
    ]
  },
  {
    id: 'insurance',
    title: '3. Страхування та відповідальність (КАСКО / ОСАГО)',
    content: [
      'Страхові поліси, покриття та винятки потрібно перевірити за документами кожного автомобіля. Сторінка не підтверджує страхування.'
    ]
  },
  {
    id: 'mileage',
    title: '4. Пробіг, паливо та територія використання',
    content: [
      'Ліміти пробігу, паливна політика та географічні обмеження мають бути підтверджені для кожного авто.'
    ]
  },
  {
    id: 'cancellation',
    title: '5. Скасування та зміна бронювання',
    content: [
      'Правила зміни та скасування, збори й повернення коштів ще не підтверджені. Заявка сама по собі не є підтвердженим бронюванням.'
    ]
  }
];

function ContractPage() {
  const [openSection, setOpenSection] = useState('requirements');
  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* Header */}
      <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-14 border-b border-white/10">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <span className="kicker text-gold mb-4">Умови та дані</span>
          <h1 className="font-display uppercase leading-[0.92] text-[44px] md:text-[84px] tracking-[0.005em] mb-6">
            Договір та умови оренди
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-[620px] leading-relaxed">
            Умови прокату ще не підтверджені власником сервісу. Нижче вказана інформація, яку потрібно узгодити перед реальним обслуговуванням клієнтів.
          </p>
        </div>
      </header>

      {/* Publication status */}
      <section className="bg-[#141414] py-10 border-b border-white/10 text-white">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="bg-[#1a1a1a] p-6 md:p-8 rounded-lg border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold font-bold block mb-1">Статус документів</span>
              <h3 className="font-display text-2xl md:text-3xl uppercase">Умови ще не затверджені</h3>
              <p className="text-white/50 text-sm mt-1">Ця сторінка не є договором і не визначає права чи обов’язки сторін.</p>
            </div>
            <a href="privacy.html" className="text-sm text-gold hover:text-white underline">Інформація про дані</a>
          </div>
        </div>
      </section>

      {/* Accordion / Content */}
      <section className="bg-[#0a0a0a] text-white py-16 md:py-24">
        <div className="w-[90%] max-w-[1200px] mx-auto grid lg:grid-cols-[1fr_360px] gap-12 items-start">
          
          {/* Розділи договору */}
          <div className="space-y-4">
            {CONTRACT_SECTIONS.map((sec) => {
              const isOpen = openSection === sec.id;
              return (
                <div
                  key={sec.id}
                  className="bg-[#141414] border border-white/10 rounded-lg overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={'contract-section-' + sec.id}
                    onClick={() => setOpenSection(isOpen ? null : sec.id)}
                    className="w-full text-left p-6 md:p-7 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-display uppercase text-xl md:text-2xl tracking-wide">{sec.title}</span>
                    <span className="w-8 h-8 rounded-full border border-white/15 grid place-items-center text-gold shrink-0 text-sm">
                      {isOpen ? '—' : '+'}
                    </span>
                  </button>

                  <div id={'contract-section-' + sec.id} hidden={!isOpen} className="px-6 md:px-7 pb-6 md:pb-7 pt-1 border-t border-white/5 text-white/70 text-sm md:text-base leading-relaxed space-y-3">
                      {sec.content.map((paragraph, pIdx) => (
                        <p key={pIdx} className="flex items-start gap-3">
                          <span className="text-gold mt-1.5">•</span>
                          <span>{paragraph}</span>
                        </p>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Бокова панель — завантаження та контакти юристів */}
          <aside className="sticky top-28 space-y-6">
            <div className="bg-[#141414] p-7 rounded-lg border border-white/10">
              <span className="w-12 h-12 rounded-full bg-gold/15 text-gold grid place-items-center mb-5">
                <Icon name="shield" size={24} />
              </span>
              <h3 className="font-display uppercase text-2xl mb-2">Договір</h3>
              <p className="text-white/50 text-sm leading-relaxed">Перевіреного юридичного шаблону не надано. Файл-заглушка не створюється.</p>
            </div>

            <div className="bg-[#141414] p-7 rounded-lg border border-white/10">
              <span className="kicker text-gold mb-2">Консультація</span>
              <h4 className="font-display uppercase text-xl mb-2">Є нестандартне питання?</h4>
              <p className="text-white/50 text-xs leading-relaxed">Перевірені контакти підтримки та години роботи власник проєкту не надав.</p>
            </div>
          </aside>

        </div>
      </section>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ContractPage />);
