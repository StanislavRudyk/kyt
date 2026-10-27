/* ===== Про компанію — сторінка (RentCar UA) ===== */

const STATS = [];

const PRINCIPLES = [
  { icon: 'sparkles', title: 'Тарифи та умови', desc: 'Власник проєкту має підтвердити ціни, комплектації й умови до відкриття приймання заявок.' },
  { icon: 'shield', title: 'Підготовка авто', desc: 'Регламент огляду та підтвердження стану автомобілів ще не надані.' },
  { icon: 'phone', title: 'Підтримка', desc: 'Канали зв’язку, години роботи та умови допомоги на дорозі ще не підтверджені.' },
];

const SHOWROOMS = [];

function AboutPage() {
  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* header */}
      <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-gold mb-6">Наша історія</span>
          <h1 className="font-display uppercase leading-[0.92] text-[48px] md:text-[100px] tracking-[0.005em] max-w-[16ch]">
            Оренда авто має приносити драйв.
          </h1>
        </div>
      </header>

      {/* mission split */}
      <section className="bg-[#0a0a0a] text-white pb-20 md:pb-28">
        <div className="w-[90%] max-w-[1300px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal variant="reveal-left">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded bg-neutral-900">
              <SmartImg src={IMG('showroom-dusk')} label="пункт видачі rentcar" alt="Пункт видачі"
                className="absolute inset-0 w-full h-full" imgClassName="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </Reveal>
          <Reveal variant="reveal-right" delay={100}>
            <p className="font-display uppercase text-[26px] md:text-[34px] leading-[1.15] tracking-[0.01em] mb-6" style={{ textWrap: 'balance' }}>
              RentCar UA народився з простого бажання: зробити оренду преміальних автомобілів швидкою, чесною та приємною.
            </p>
            <p className="text-white/55 text-base md:text-lg leading-relaxed mb-5">
              Профіль компанії, юридична назва та підтверджені відомості про автопарк ще не надані власником проєкту.
            </p>
            <p className="text-white/55 text-base md:text-lg leading-relaxed">
              Цей розділ буде заповнений перевіреною інформацією після підтвердження контактів, місць роботи та умов обслуговування.
            </p>
          </Reveal>
        </div>
      </section>

      {/* stats band */}
      {STATS.length > 0 && <section className="bg-[#F4F2ED] text-black py-16 md:py-20">
        <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-[56px] md:text-[80px] leading-none tabular-nums">
                <CountUp end={s.end} decimals={s.decimals || 0} suffix={s.suffix} />
              </p>
              <p className="text-black/45 text-xs md:text-sm tracking-[0.16em] uppercase mt-3">{s.label}</p>
            </div>
          ))}
        </div>
      </section>}

      {/* principles */}
      <section className="bg-[#0a0a0a] text-white py-20 md:py-28">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-white/45 mb-6">Інформація для власника</span>
          <h2 className="font-display uppercase text-[40px] md:text-[68px] leading-[0.9] tracking-[0.005em] mb-14 max-w-[14ch]">
            Потрібно підтвердити перед публікацією.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded overflow-hidden">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <div className="bg-[#0a0a0a] p-8 md:p-10 h-full flex flex-col gap-5">
                  <span className="w-14 h-14 rounded-full border border-white/15 grid place-items-center text-gold">
                    <Icon name={p.icon} size={24} stroke={1.6} />
                  </span>
                  <h3 className="font-display uppercase text-2xl md:text-[28px] leading-[0.95] tracking-[0.01em]">{p.title}</h3>
                  <p className="text-white/55 text-sm md:text-[15px] leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* showrooms */}
      <section className="bg-white text-black py-20 md:py-28">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
            <h2 className="font-display uppercase text-[40px] md:text-[68px] leading-[0.9] tracking-[0.005em]">
              Пункти видачі
            </h2>
            <p className="text-black/55 max-w-[320px] md:text-right">Підтверджені адреси пунктів видачі та доставки не надані.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border border-black/10 rounded overflow-hidden">
            {SHOWROOMS.map((o) => (
              <div key={o.city} className="bg-white p-6 md:p-8">
                <Icon name="pin" size={20} className="text-gold mb-5" />
                <h3 className="font-display uppercase text-2xl md:text-3xl leading-none mb-2">{o.city}</h3>
                <p className="text-black/50 text-sm leading-snug">{o.addr}</p>
              </div>
            ))}
            {SHOWROOMS.length === 0 && <p className="col-span-full bg-white p-6 text-black/55">Локації очікують підтвердження.</p>}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="bg-[#0a0a0a] text-white py-24 md:py-36">
        <div className="w-[90%] max-w-[1000px] mx-auto text-center">
          <span className="kicker is-centered text-gold mb-6">Готові до подорожі?</span>
          <h2 className="font-display uppercase text-[44px] md:text-[84px] leading-[0.9] tracking-[0.005em] mb-10" style={{ textWrap: 'balance' }}>
            Ваше ідеальне авто готове до видачі.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAButton variant="primary" href="Inventory.html">Обрати авто</CTAButton>
            <CTAButton variant="ghost" arrow={false} href="Service.html">Забронювати</CTAButton>
          </div>
        </div>
      </section>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AboutPage />);
