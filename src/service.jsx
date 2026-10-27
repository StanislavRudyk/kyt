/* ===== Наші послуги — відео фон + картки (RentCar UA) ===== */

const SERVICE_CARDS = [
  { icon: 'calendar', no: '01', label: 'Заявка онлайн', sub: 'Очікує підтвердження компанією' },
  { icon: 'route', no: '02', label: 'Дати оренди', sub: 'Перевіряються сервером' },
  { icon: 'sparkles', no: '03', label: 'Тариф', sub: 'Попередній розрахунок' },
  { icon: 'phone', no: '04', label: 'Підтримка', sub: 'Контакти ще не надані' },
];

function Service() {
  const titleRef = useRef(null);
  const cardsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || AVOID_BACKGROUND_VIDEO || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      video.src = 'assets/videos/service-workshop.mp4';
      video.load();
      video.play().catch(() => {});
      observer.disconnect();
    }, { rootMargin: '300px 0px' });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useCharReveal(titleRef, []);

  useEffect(() => {
    if (!window.gsap || !cardsRef.current || PREFERS_REDUCED_MOTION) return;
    const cards = cardsRef.current.querySelectorAll('[data-svc-card]');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 80 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15,
          scrollTrigger: { trigger: cardsRef.current, start: 'top 90%', once: true },
        }
      );
    }, cardsRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="service" className="relative w-full overflow-hidden bg-black">
      {/* повноекранне атмосферне відео */}
      <SmartImg src="assets/images/showroom-dusk.jpg" alt="" loading="lazy" sizes="100vw" className="absolute inset-0 w-full h-full" imgClassName="object-cover" />
      <video
        ref={videoRef} poster="assets/images/showroom-dusk-1200.webp"
        loop muted playsInline preload="none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover media-grade"
      />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,var(--video-dim))' }} />
      <div className="vignette" />

      <div className="relative z-10 px-4 md:px-10 py-24 md:py-32">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-center mb-5">
            <span className="kicker is-centered text-white/55">Як це працює</span>
          </div>
          <h2
            ref={titleRef}
            data-scroll="true"
            className="font-display uppercase text-white text-center leading-[0.92]
                       text-[42px] sm:text-[60px] md:text-[88px] tracking-[0.01em] mb-16 md:mb-20"
          >
            <SplitChars text="Від вибору" className="font-display" />
            <br />
            <SplitChars text="до заявки" className="font-display" />
          </h2>

          <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SERVICE_CARDS.map((c) => (
              <div
                key={c.label}
                data-svc-card
                className="group relative bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-md border border-white/10 px-6 py-11 flex flex-col items-center text-center gap-5
                           hover:border-gold/50 hover:from-white/[0.1] hover:-translate-y-1.5 transition-all duration-400"
              >
                <span className="absolute top-4 left-5 font-display text-lg tracking-[0.12em] text-white/25 group-hover:text-gold/80 transition-colors duration-400">{c.no}</span>
                <span className="w-16 h-16 rounded-full border border-white/15 grid place-items-center text-white/90 group-hover:text-gold group-hover:border-gold/40 group-hover:shadow-[0_0_28px_-6px_var(--gold)] transition-all duration-400">
                  <Icon name={c.icon} size={26} stroke={1.6} />
                </span>
                <div>
                  <p className="text-white font-semibold text-[15px] tracking-tight">{c.label}</p>
                  <p className="text-white/45 text-xs mt-1.5 tracking-wide">{c.sub}</p>
                </div>
                <span className="absolute bottom-0 left-0 h-px w-0 bg-gold group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.Service = Service;
