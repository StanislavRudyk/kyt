/* ===== Відгуки клієнтів — carousel (RentCar UA) ===== */

const REVIEWS_DATA = [];

function Reviews() {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };
  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };
  const handleMouseUp = () => setIsDragging(false);

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  if (!REVIEWS_DATA.length) return null;

  return (
    <section id="reviews" className="bg-[#0a0a0a] text-white py-20 md:py-28 overflow-hidden">
      <div className="w-[90%] max-w-[1300px] mx-auto mb-10 md:mb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <span className="kicker text-gold mb-5">Відгуки</span>
            <h2 className="font-display uppercase leading-[0.9] text-[44px] md:text-[72px] tracking-[0.005em]">
              Що кажуть<br />наші клієнти
            </h2>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[56px] md:text-[72px] leading-none tabular-nums text-gold">
              <CountUp end={4.9} decimals={1} />
            </span>
            <div>
              <p className="text-gold text-lg tracking-wider">★★★★★</p>
              <p className="text-white/40 text-xs tracking-[0.14em] uppercase mt-1">Середня оцінка</p>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 md:gap-5 px-[5vw] overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {REVIEWS_DATA.map((r, i) => (
          <Reveal key={i} delay={i * 80}>
            <article className="shrink-0 w-[85vw] sm:w-[380px] md:w-[420px] bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded p-7 md:p-9 flex flex-col gap-5 hover:border-gold/30 transition-colors duration-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-gold/20 text-gold grid place-items-center font-display text-lg">
                    {r.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-white/40 text-xs">{r.city}</p>
                  </div>
                </div>
                <span className="text-gold text-sm tracking-wider">{stars(r.rating)}</span>
              </div>
              <p className="text-white/65 text-sm md:text-[15px] leading-relaxed flex-1">«{r.text}»</p>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                <Icon name="route" size={14} className="text-gold" />
                <span className="text-white/40 text-xs tracking-[0.12em] uppercase">{r.car}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

window.Reviews = Reviews;
