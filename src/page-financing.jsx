/* ===== Тарифи — сторінка (RentCar UA) ===== */

const TARIFF_PLANS = [
  { id: 'daily', name: 'Тариф автомобіля', price: 'За добу', period: 'за даними каталогу', features: ['Розрахунок за вибраною моделлю', 'Суму повертає сервер', 'Неповні доби та додаткові нарахування ще не налаштовані'], popular: false },
];

const HOW_STEPS = [
  { no: '01', icon: 'sliders',  title: 'Оберіть',       desc: 'Перегляньте каталог, порівняйте моделі та оберіть авто, що підходить саме вам — за класом, ціною чи доступністю.' },
  { no: '02', icon: 'calendar', title: 'Перевірте період', desc: 'Оберіть місця отримання й повернення, дату та місцевий час. Сервер перевірить весь інтервал.' },
  { no: '03', icon: 'check',    title: 'Дочекайтеся відповіді', desc: 'Після розгляду заявки оператор має підтвердити наявність, точну ціну, видачу та правила скасування.' },
];

function TariffsPage() {
  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* заголовок */}
      <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-gold mb-5">Тарифи</span>
          <h1 className="font-display uppercase leading-[1.0] text-[46px] md:text-[80px] lg:text-[96px] tracking-[0.005em]">
            Попередній розрахунок
          </h1>
          <p className="text-white/55 text-base leading-relaxed max-w-[480px] mt-6">
            Нижче наведена математика попереднього калькулятора. Це не офіційна пропозиція: тарифи та додаткові умови власником не підтверджені.
          </p>
        </div>
      </header>

      {/* тарифні картки */}
      <section className="bg-[#0a0a0a] text-white pb-20 md:pb-28">
        <div className="w-[90%] max-w-[1300px] mx-auto grid md:grid-cols-3 gap-4 lg:gap-6">
          {TARIFF_PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100}>
              <div className={'relative rounded p-7 md:p-9 flex flex-col h-full ' + (plan.popular ? 'card-elev ring-1 ring-gold/30' : 'border border-white/10 bg-white/[0.02]')}>
                {plan.badge && (
                  <span className="absolute top-4 right-4 bg-gold text-black text-[11px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded">{plan.badge}</span>
                )}
                <h3 className="font-display uppercase text-3xl md:text-4xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-[40px] md:text-[52px] leading-none tabular-nums">{plan.price}</span>
                  <span className="text-white/45 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Icon name="check" size={15} className="text-gold shrink-0" />
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <CTAButton variant={plan.popular ? 'primary' : 'ghost'} href="Service.html" className="w-full" style={{ width: '100%' }}>
                  Забронювати
                </CTAButton>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* як це працює */}
      <section className="bg-[#F4F2ED] text-black py-20 md:py-28">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-black/45 mb-6">Як це працює</span>
          <h2 className="font-display uppercase text-[40px] md:text-[64px] leading-[0.9] tracking-[0.005em] mb-14 max-w-[14ch]">
            Від вибору до ключів за три кроки.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-black/10 border border-black/10 rounded overflow-hidden">
            {HOW_STEPS.map((s) => (
              <Reveal key={s.no}>
                <div className="bg-[#F4F2ED] p-8 md:p-10 h-full flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl text-black/15">{s.no}</span>
                    <span className="w-12 h-12 rounded-full border border-black/15 grid place-items-center text-black"><Icon name={s.icon} size={22} stroke={1.6} /></span>
                  </div>
                  <h3 className="font-display uppercase text-2xl md:text-3xl leading-none">{s.title}</h3>
                  <p className="text-black/55 text-sm md:text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a0a0a] text-white pt-8 pb-24 md:pb-32">
        <div className="w-[90%] max-w-[1000px] mx-auto text-center">
          <h2 className="font-display uppercase text-[40px] md:text-[72px] leading-[0.9] tracking-[0.005em] mb-9" style={{ textWrap: 'balance' }}>
            Обрали тариф? Час знайти авто.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAButton variant="primary" href="Inventory.html">Каталог авто</CTAButton>
            <CTAButton variant="ghost" arrow={false} href="Service.html">Забронювати</CTAButton>
          </div>
        </div>
      </section>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TariffsPage />);
