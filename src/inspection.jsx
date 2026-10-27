/* ===== Підготовка авто — горизонтальний скрол (RentCar UA) ===== */

const STEPS = [
  { no: '01', icon: 'sparkles', title: 'Кузов та лакофарбове',   n: 12, desc: 'Перевірка панелей, фарби, скла, фар та обшивки перед кожною видачею авто клієнту.' },
  { no: '02', icon: 'wrench',   title: 'Двигун та ходова',       n: 18, desc: 'Двигун, коробка передач, рідини та опори перевіряються під навантаженням при робочій температурі.' },
  { no: '03', icon: 'gauge',    title: 'Гальма та шини',         n: 10, desc: 'Знос колодок і дисків, глибина протектору, вік шин, розвал-сходження та робота ABS.' },
  { no: '04', icon: 'shield',   title: 'Електроніка та безпека', n: 14, desc: 'Калібрування систем допомоги водію, подушки безпеки, датчики та всі системи попередження.' },
  { no: '05', icon: 'sparkles', title: 'Салон та комфорт',       n: 8,  desc: 'Оббивка, перемикачі, клімат-контроль та косметичний стан — професійний детейлінг.' },
  { no: '06', icon: 'route',    title: 'Тестовий заїзд',         n: 6,  desc: 'Контрольна поїздка 20 км змішаним маршрутом — перевірка ходу, шумів, гальмування.' },
];

function Inspection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const motionOK = !PREFERS_REDUCED_MOTION;

  // Горизонтальний скрол при прокрутці
  useEffect(() => {
    if (!motionOK) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    let amount = 0;
    let ticking = false;

    const measure = () => {
      amount = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      section.style.height = (window.innerHeight + amount) + 'px';
    };
    const apply = () => {
      ticking = false;
      const top = section.getBoundingClientRect().top;
      const scrolled = Math.min(Math.max(-top, 0), amount);
      track.style.transform = `translate3d(${-scrolled}px,0,0)`;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    const onResize = () => { measure(); apply(); };

    measure(); apply();
    const t1 = setTimeout(() => { measure(); apply(); }, 80);
    const t2 = setTimeout(() => { measure(); apply(); }, 600);
    document.fonts && document.fonts.ready.then(() => { measure(); apply(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      section.style.height = '';
    };
  }, [motionOK]);

  const Card = ({ s }) => (
    <article className="hpanel w-[80vw] sm:w-[400px] md:w-[440px] h-[368px] sm:h-[400px] md:h-[424px] bg-[#f4f2ed] border border-black/[0.08] rounded p-7 sm:p-8 md:p-9 flex flex-col">
      <div className="flex items-center justify-between mb-5 md:mb-7">
        <span className="font-display text-5xl md:text-6xl text-black/15 leading-none">{s.no}</span>
        <span className="w-12 h-12 rounded-full border border-black/15 grid place-items-center text-black">
          <Icon name={s.icon} size={22} stroke={1.6} />
        </span>
      </div>
      <h3 className="font-display uppercase text-[26px] md:text-[34px] leading-[0.95] tracking-[0.01em] mb-3">{s.title}</h3>
      <p className="text-black/55 text-sm md:text-[15px] leading-relaxed flex-1">{s.desc}</p>
      <div className="mt-5 pt-4 border-t border-black/10 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.18em] uppercase text-black/40">Контрольні точки</span>
        <span className="font-display text-2xl md:text-3xl tabular-nums"><CountUp end={s.n} /></span>
      </div>
    </article>
  );

  const Header = () => (
    <div className="px-[5vw] mb-6 md:mb-9 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-10">
      <div className="md:shrink-0">
        <span className="kicker text-black/45 mb-3.5">Підготовка</span>
        <h2 className="font-display uppercase leading-[0.9] text-[32px] sm:text-[52px] md:text-[66px] tracking-[0.005em]">
          <CountUp end={68} /> перевірок.<br />Жодних компромісів.
        </h2>
      </div>
      <p className="md:max-w-[270px] text-black/55 text-sm md:text-[15px] leading-relaxed md:text-right">
        Кожне авто RentCar проходить шестиетапну перевірку перед видачею клієнту. Прокручуйте, щоб побачити деталі.
      </p>
    </div>
  );

  const EndCap = () => (
    <article className="hpanel w-[80vw] sm:w-[400px] md:w-[440px] h-[368px] sm:h-[400px] md:h-[424px] card-elev text-white rounded p-7 sm:p-8 md:p-9 flex flex-col justify-between">
      <div>
        <span className="kicker text-gold mb-5">Гарантія</span>
        <h3 className="font-display uppercase text-[30px] md:text-[40px] leading-[0.92] tracking-[0.01em]">
          Перевірено —<br />або не<br />видаємо.
        </h3>
      </div>
      <CTAButton variant="primary" href="Inventory.html">Обрати авто</CTAButton>
    </article>
  );

  if (!motionOK) {
    return (
      <section id="process" className="bg-white text-black py-20 overflow-hidden">
        <Header />
        <div className="overflow-x-auto">
          <div className="flex w-max gap-4 md:gap-5 px-[5vw]">
            {STEPS.map((s) => <Card key={s.no} s={s} />)}
            <EndCap />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="process" className="bg-white text-black relative">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <Header />
        <div ref={trackRef} className="flex w-max gap-4 md:gap-5 px-[5vw]" style={{ willChange: 'transform' }}>
          {STEPS.map((s) => <Card key={s.no} s={s} />)}
          <EndCap />
        </div>
      </div>
    </section>
  );
}

window.Inspection = Inspection;
