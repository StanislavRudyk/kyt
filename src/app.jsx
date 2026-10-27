/* ===== App — збірка, GSAP плагіни, Tweaks (RentCar UA) ===== */

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C89B4A",
  "videoDim": 0.72,
  "grain": true,
  "ghost": 1,
  "taglineScale": 1
}/*EDITMODE-END*/;

const ACCENTS = ['#C89B4A', '#CBA45A', '#C0461F', '#3E7CB1', '#9AA0A6', '#E8E6E1'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const progressRef = useRef(null);

  // CSS custom properties з налаштувань
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--gold', t.accent);
    r.setProperty('--video-dim', String(t.videoDim));
    r.setProperty('--grain-opacity', t.grain ? '0.07' : '0');
    r.setProperty('--ghost-opacity', String(t.ghost));
    r.setProperty('--tagline-scale', String(t.taglineScale));
  }, [t.accent, t.videoDim, t.grain, t.ghost, t.taglineScale]);

  // прогрес-бар скролу
  useEffect(() => {
    const onScroll = () => {
      if (!progressRef.current) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      progressRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  // оновлення ScrollTrigger після завантаження шрифтів
  useEffect(() => {
    if (!window.ScrollTrigger) return;
    const r = () => ScrollTrigger.refresh();
    const id = setTimeout(r, 400);
    window.addEventListener('load', r);
    document.fonts && document.fonts.ready.then(r);
    return () => { clearTimeout(id); window.removeEventListener('load', r); };
  }, []);

  return (
    <React.Fragment>
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <Inventory />
        <Spotlight />
        <Inspection />
        <Financing />
        <Availability />
        <Service />
        <Reviews />
        <About />
        <FAQ />
        <Partners />
      </main>
      <Footer />

      {/* кінематографічне зерно */}
      <div className="grain" aria-hidden="true" />

      <TweaksPanel>
        <TweakSection label="Акцент" />
        <TweakColor label="Колір акценту" value={t.accent} options={ACCENTS}
                    onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Кінематограф" />
        <TweakSlider label="Затемнення відео" value={t.videoDim} min={0.3} max={0.9} step={0.02}
                     onChange={(v) => setTweak('videoDim', v)} />
        <TweakToggle label="Плівкове зерно" value={t.grain}
                     onChange={(v) => setTweak('grain', v)} />
        <TweakSlider label="Ghost-слово" value={t.ghost} min={0} max={1} step={0.05}
                     onChange={(v) => setTweak('ghost', v)} />
        <TweakSection label="Типографіка" />
        <TweakSlider label="Розмір слогану" value={t.taglineScale} min={0.8} max={1.3} step={0.05}
                     onChange={(v) => setTweak('taglineScale', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
