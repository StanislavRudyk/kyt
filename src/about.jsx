/* ===== Про нас — word reveal при скролі (RentCar UA) ===== */

const ABOUT_TEXT =
  'RentCar UA створений з простою ідеєю: оренда авто має бути такою ж захопливою, як і сама подорож. ' +
  'Кожен автомобіль проходить 68 перевірок, має прозору ціну та підтримку команди, яка завжди на зв\'язку. ' +
  'Без прихованих платежів, без зайвого тиску — тільки ідеальне авто для вашої наступної пригоди.';

function About() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useCharReveal(titleRef, []);

  useEffect(() => {
    if (!window.gsap || !containerRef.current) return;
    const words = containerRef.current.querySelectorAll('[data-word]');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { rotate: 3 },
        {
          rotate: 0, ease: 'none',
          scrollTrigger: { trigger: containerRef.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
        }
      );
      gsap.fromTo(
        words,
        { opacity: 0.1, filter: 'blur(4px)' },
        {
          opacity: 1, filter: 'blur(0px)', stagger: 0.05, ease: 'none',
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'bottom 60%', scrub: true },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="bg-white py-20 md:py-36 flex justify-center">
      <div className="w-[90%] md:w-[68%] max-w-[1000px] text-center" style={{ transformOrigin: '50% 0%' }} ref={containerRef}>
        <div className="flex justify-center mb-5">
          <span className="kicker is-centered text-black/45">Хто ми</span>
        </div>
        <h2 ref={titleRef} data-scroll="true" className="font-display uppercase text-black leading-[0.9] text-[48px] md:text-[80px] tracking-[0.01em] mb-10">
          <SplitChars text="Про RentCar" className="font-display" />
        </h2>

        <p className="text-black text-2xl md:text-[34px] leading-[1.4] font-medium" style={{ textWrap: 'balance' }}>
          {ABOUT_TEXT.split(' ').map((w, i) => (
            <span key={i} data-word className="inline-block mr-[0.28em]">{w}</span>
          ))}
        </p>

        <div className="mt-12 flex justify-center">
          <CTAButton variant="dark" href="About.html">Дізнатись більше</CTAButton>
        </div>
      </div>
    </section>
  );
}

window.About = About;
