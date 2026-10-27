/* ===== Hero — scroll-driven clip-path video slider (RentCar UA) ===== */

const SCROLL_PER_SLIDE_VH = 150;

/* Кінематографічні відеоплейти — повноекранні зациклені відео */
const HERO_PLATES = [
  { src: 'assets/videos/hero-driving.mp4', poster: 'assets/images/huracan-yellow.jpg', label: 'відео · головна 01' },
  { src: 'assets/videos/hero-studio-1.mp4', poster: 'assets/images/showroom-dusk.jpg', label: 'відео · головна 02' },
  { src: 'assets/videos/hero-studio-2.mp4', poster: 'assets/images/huracan-studio.jpg', label: 'відео · головна 03' },
];

function Hero() {
  const wrapperRef = useRef(null);
  const slide1Ref = useRef(null);
  const slide2Ref = useRef(null);
  const taglineRef = useRef(null);
  const counterRef = useRef(null);
  const barRef = useRef(null);
  const leftRef = useRef(null);
  const activeSlideRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);

  // Scroll-driven clip-path reveal
  useEffect(() => {
    const refs = [slide1Ref, slide2Ref];
    if (PREFERS_REDUCED_MOTION) {
      refs.forEach((ref) => { if (ref.current) ref.current.style.display = 'none'; });
      return;
    }
    const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    let ticking = false;

    const apply = () => {
      ticking = false;
      if (!wrapperRef.current) return;
      const vh = window.innerHeight;
      const slideDist = (SCROLL_PER_SLIDE_VH / 100) * vh;
      const scrolled = -wrapperRef.current.getBoundingClientRect().top;
      refs.forEach((ref, idx) => {
        if (!ref.current) return;
        let p = (scrolled - idx * slideDist) / slideDist;
        p = Math.max(0, Math.min(1, p));
        const e = easeInOut(p);
        ref.current.style.clipPath = `ellipse(${5 + e * 150}% ${8 + e * 150}% at 50% 50%)`;
      });
      // динамічний лічильник слайдів + progress bar
      const overall = slideDist > 0 ? Math.max(0, Math.min(1, scrolled / (2 * slideDist))) : 0;
      const active = slideDist > 0 ? Math.min(3, Math.max(1, Math.floor(scrolled / slideDist + 0.5) + 1)) : 1;
      if (activeSlideRef.current !== active - 1) {
        activeSlideRef.current = active - 1;
        setActiveSlide(active - 1);
      }
      if (counterRef.current) counterRef.current.textContent = '0' + active;
      if (barRef.current) barRef.current.style.transform = `scaleX(${0.04 + overall * 0.96})`;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };
    apply();
    requestAnimationFrame(apply);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // SplitText tagline reveal on load
  useCharReveal(taglineRef, []);

  // Staggered entrance for the hero copy block on load
  useEffect(() => {
    if (!window.gsap || !leftRef.current || PREFERS_REDUCED_MOTION) return;
    const els = leftRef.current.querySelectorAll('[data-hero-el]');
    const ctx = gsap.context(() => {
      gsap.from(els, {
        opacity: 0, y: 26, duration: 0.85, stagger: 0.12, delay: 0.25, ease: 'power3.out',
      });
    }, leftRef);
    return () => ctx.revert();
  }, []);

  const Plate = ({ plate, refEl, style, index }) => (
    <div ref={refEl} className="absolute inset-0 overflow-hidden bg-black" style={style}>
      <SmartImg src={plate.poster} alt="" label="" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : undefined} sizes="100vw" className="absolute inset-0 w-full h-full" imgClassName="object-cover" />
      {activeSlide === index && !AVOID_BACKGROUND_VIDEO && <video
        src={plate.src} poster={plate.poster.replace('.jpg', '-1200.webp')} autoPlay loop muted playsInline preload="none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} aria-hidden="true"
        className="relative w-full h-full object-cover media-grade"
      />}
    </div>
  );

  return (
    <section ref={wrapperRef} id="top" style={{ height: PREFERS_REDUCED_MOTION ? '100vh' : 'calc(100vh + 300vh)' }} className="relative">
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        {/* z0: stacked plates */}
        <Plate plate={HERO_PLATES[0]} index={0} />
        <Plate plate={HERO_PLATES[1]} index={1} refEl={slide1Ref} style={{ clipPath: 'ellipse(5% 8% at 50% 50%)' }} />
        <Plate plate={HERO_PLATES[2]} index={2} refEl={slide2Ref} style={{ clipPath: 'ellipse(5% 8% at 50% 50%)' }} />

        {/* градієнти для читабельності + кінематографічна віньєтка */}
        <div className="absolute top-0 inset-x-0 h-[260px] bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-[1]" />
        <div className="absolute bottom-0 inset-x-0 h-[320px] bg-gradient-to-t from-black/75 to-transparent pointer-events-none z-[1]" />
        <div className="vignette z-[1]" />

        {/* z1: ghost word */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2] pb-20">
          <span className="ghost-word">RENTCAR</span>
        </div>

        {/* лічильник слайдів */}
        <div className="absolute top-24 md:top-28 right-4 md:right-10 z-[3] hidden sm:flex items-center gap-3 md:gap-4 tabular-nums">
          <span ref={counterRef} className="text-white font-display text-xl md:text-2xl tracking-[0.08em] leading-none">01</span>
          <span className="relative w-12 md:w-16 h-[2px] bg-white/15 overflow-hidden rounded-full">
            <span ref={barRef} className="absolute inset-0 origin-left bg-gold" style={{ transform: 'scaleX(0.04)' }} />
          </span>
          <span className="text-white/40 font-display text-sm md:text-base tracking-[0.08em] leading-none">03</span>
        </div>

        {/* z2: закріплений контент */}
        <div className="absolute bottom-0 inset-x-0 px-5 sm:px-6 md:px-10 pb-10 sm:pb-12 md:pb-14 z-[4]
                        flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7 md:gap-8">
          {/* заголовок */}
          <h1
            ref={taglineRef}
            className="hero-tagline order-1 lg:order-2 w-full lg:max-w-[466px] font-display uppercase text-white leading-[0.92]
                       tracking-[0.01em] lg:text-right"
          >
            <SplitChars text="Орендуй авто мрії за кілька кліків." className="font-display" />
          </h1>

          {/* лівий блок */}
          <div ref={leftRef} className="order-2 lg:order-1 max-w-full sm:max-w-[424px]">
            <span data-hero-el className="kicker text-white/55 mb-3 md:mb-5">Оренда преміум авто</span>
            <p data-hero-el className="text-[#E4E4E4] text-[15px] sm:text-base md:text-[19px] leading-[1.5] md:leading-[1.55] font-normal">
              Оберіть автомобіль і надішліть заявку. Наявність та остаточні умови підтверджуються окремо.
            </p>
            <div data-hero-el className="mt-6 md:mt-7 flex flex-wrap items-center gap-3">
              <CTAButton variant="primary" href="Inventory.html">Обрати авто</CTAButton>
              <CTAButton variant="ghost" arrow={false} href="Financing.html">Тарифи</CTAButton>
            </div>
          </div>
        </div>

        {/* підказка скролу */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[4] hidden md:flex flex-col items-center gap-2.5 text-white/40">
          <span className="text-[10px] tracking-[0.3em] uppercase">Прокрутіть</span>
          <span className="relative w-px h-9 bg-white/15">
            <span className="scroll-dot absolute left-1/2 -translate-x-1/2 top-0" />
          </span>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
