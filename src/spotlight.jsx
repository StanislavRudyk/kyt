/* ===== Авто тижня — кінематографічна секція з паралаксом (RentCar UA) ===== */

const SPOT_SPECS = [
  { icon: 'zap',    label: '0–100 км/год',    end: 2.9, decimals: 1, suffix: 'с' },
  { icon: 'wrench', label: 'Потужність',       end: 602, suffix: ' к.с.' },
  { icon: 'gauge',  label: 'Макс. швидкість',  end: 325, suffix: ' км/год' },
  { icon: 'route',  label: 'Тариф/добу',       end: 12500, suffix: ' ₴' },
];

function Spotlight() {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  // паралакс на зображенні авто
  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current || !imgRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      const shift = Math.max(-46, Math.min(46, -progress * 64));
      imgRef.current.style.transform = `translateY(${shift}px) scale(1.14)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  return (
    <section id="spotlight" className="bg-[#0a0a0a] text-white py-20 md:py-28 overflow-hidden">
      <div className="w-[90%] max-w-[1300px] mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-center">

        {/* текст */}
        <div className="order-2 lg:order-1">
          <Reveal as="div"><span className="kicker text-gold mb-5">Авто тижня</span></Reveal>
          <Reveal as="p" delay={60} className="text-white/45 text-sm tracking-[0.18em] uppercase mb-2">Lamborghini</Reveal>
          <Reveal as="h2" delay={90} className="font-display uppercase leading-[0.88] text-[58px] md:text-[92px] tracking-[0.01em] mb-5">
            Huracán&nbsp;EVO
          </Reveal>
          <Reveal as="p" delay={140} className="text-white/60 text-base md:text-lg leading-relaxed max-w-[440px] mb-9">
            Атмосферний V10, повний привід, щоденна підготовка — яскравий Giallo Belenus з чорною Alcantara всередині. Відчуйте справжню швидкість.
          </Reveal>

          {/* spec grid */}
          <Reveal delay={180} className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-10">
            {SPOT_SPECS.map((s) => (
              <div key={s.label} className="bg-[#0a0a0a] px-4 py-5 flex flex-col gap-2">
                <Icon name={s.icon} size={18} className="text-gold" stroke={1.6} />
                <p className="font-display text-3xl md:text-[34px] leading-none tabular-nums">
                  <CountUp end={s.end} decimals={s.decimals || 0} suffix={s.suffix || ''} />
                </p>
                <p className="text-white/40 text-[11px] tracking-[0.14em] uppercase">{s.label}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={220} className="flex flex-wrap items-center gap-5">
            <CTAButton variant="primary" href="Inventory.html">Обрати авто</CTAButton>
            <div className="flex items-baseline gap-2">
              <span className="text-white/45 text-sm">від</span>
              <span className="font-display text-3xl md:text-4xl tracking-wide">12 500 ₴<span className="text-lg text-white/50">/добу</span></span>
            </div>
          </Reveal>
        </div>

        {/* зображення */}
        <Reveal variant="reveal-right" className="order-1 lg:order-2">
          <div ref={wrapRef} className="relative w-full aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded bg-neutral-900">
            <div ref={imgRef} className="absolute inset-0" style={{ transform: 'scale(1.14)', willChange: 'transform' }}>
              <SmartImg
                src="assets/images/huracan-yellow.jpg"
                label="авто тижня"
                alt="Lamborghini Huracán EVO — авто тижня"
                className="absolute inset-0 w-full h-full"
                imgClassName="object-cover w-full h-full"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 pointer-events-none" />
            {/* плаваючий чіп */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-[11px] tracking-[0.16em] uppercase text-white/90">Перевірено ✓</span>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

window.Spotlight = Spotlight;
