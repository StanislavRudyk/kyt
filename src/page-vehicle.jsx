/* ===== Деталі авто — сторінка (RentCar UA) ===== */

function Gallery({ v }) {
  const images = Array.isArray(v.gallery) && v.gallery.length ? v.gallery : [v.img];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const active = images[activeIndex];
  const move = (amount) => setActiveIndex((index) => (index + amount + images.length) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setLightboxOpen(false); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'Tab') {
        const controls = Array.from(document.querySelectorAll('[data-gallery-dialog] button:not(:disabled)'));
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [lightboxOpen, images.length]);

  return (
    <div>
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded bg-neutral-900">
        <SmartImg key={active} src={IMG(active, 1400)} label={v.make + ' ' + v.model} alt={v.make + ' ' + v.model} loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 90vw, 700px"
          className="absolute inset-0 w-full h-full" imgClassName="object-cover w-full h-full" />
        <button ref={triggerRef} type="button" onClick={() => setLightboxOpen(true)} aria-haspopup="dialog" aria-label={'Збільшити фото ' + (activeIndex + 1) + ' для ' + v.make + ' ' + v.model} className="absolute inset-0 z-[1] h-full w-full cursor-zoom-in"><span className="sr-only">Відкрити фото у збільшеному вигляді</span></button>
        <span className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase text-white/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          {activeIndex + 1} / {images.length}
        </span>
        {images.length > 1 && <div className="absolute inset-x-3 bottom-3 z-[2] flex justify-between pointer-events-none"><button type="button" aria-label="Попереднє фото" onClick={() => move(-1)} className="icon-btn pointer-events-auto h-11 w-11 bg-black/70 text-white">‹</button><button type="button" aria-label="Наступне фото" onClick={() => move(1)} className="icon-btn pointer-events-auto h-11 w-11 bg-black/70 text-white">›</button></div>}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {images.map((g, i) => (
            <button key={g + i} type="button" aria-label={'Показати фото ' + (i + 1) + ' для ' + v.model} aria-pressed={activeIndex === i} onClick={() => setActiveIndex(i)}
              className={'relative aspect-[4/3] overflow-hidden rounded transition-all duration-200 ' +
                (activeIndex === i ? 'ring-2 ring-gold' : 'opacity-60 hover:opacity-100')}>
              <SmartImg src={IMG(g)} label="перегляд" alt="" className="absolute inset-0 w-full h-full" imgClassName="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
      {lightboxOpen && <div data-gallery-dialog role="dialog" aria-modal="true" aria-label={'Галерея ' + v.make + ' ' + v.model} className="fixed inset-0 z-[60] bg-black/95 text-white flex flex-col items-center justify-center p-4 sm:p-8" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
        <div className="absolute right-4 top-4 flex items-center gap-3"><span aria-live="polite" className="text-sm text-white/70">{activeIndex + 1} / {images.length}</span><button ref={closeRef} type="button" aria-label="Закрити галерею" onClick={() => setLightboxOpen(false)} className="icon-btn h-11 w-11 text-white">×</button></div>
        <div className="relative flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center gap-3 sm:gap-6">
          {images.length > 1 && <button type="button" aria-label="Попереднє фото" onClick={() => move(-1)} className="icon-btn h-11 w-11 shrink-0 text-white">‹</button>}
          <SmartImg key={'lightbox-' + active} src={IMG(active, 1800)} label={v.make + ' ' + v.model} alt={`${v.make} ${v.model}, фото ${activeIndex + 1}`} className="h-full max-h-[80vh] min-h-0 max-w-full flex-1" imgClassName="h-full w-full object-contain" />
          {images.length > 1 && <button type="button" aria-label="Наступне фото" onClick={() => move(1)} className="icon-btn h-11 w-11 shrink-0 text-white">›</button>}
        </div>
        <p className="mt-4 text-sm text-white/65">{v.make} {v.model}</p>
      </div>}
    </div>
  );
}

function SpecCell({ label, children }) {
  return (
    <div className="bg-[#0a0a0a] px-4 py-5 flex flex-col gap-1.5">
      <p className="font-display text-2xl md:text-[30px] leading-none tabular-nums">{children}</p>
      <p className="text-white/40 text-[11px] tracking-[0.14em] uppercase">{label}</p>
    </div>
  );
}

function VehicleTariffs({ v }) {
  const rates = [['За добу', v.pricePerDay], ['За тиждень', v.pricePerWeek], ['За місяць', v.pricePerMonth]];
  return <div className="card-elev rounded p-7 md:p-9">
    <span className="kicker text-white/45 mb-5">Тарифи з каталогу</span>
    <div className="divide-y divide-white/10">
      {rates.map(([period, price]) => <div key={period} className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0">
        <span className="text-sm text-white/65">{period}</span><span className="font-display text-2xl text-white tabular-nums">{fmtMoney(price)}</span>
      </div>)}
    </div>
    <p className="text-white/45 text-xs mt-6">Ціни взято з каталогу, але власник ще має їх підтвердити. Страхування, додаткові послуги й фінальну вартість потрібно уточнити.</p>
  </div>;
}

function SimilarCard({ v }) {
  return (
    <a href={'Vehicle.html?id=' + encodeURIComponent(v.id)} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded bg-neutral-200 transition-shadow duration-500 group-hover:shadow-[0_24px_52px_-20px_rgba(0,0,0,0.42)]">
        <SmartImg src={IMG(v.img, 800)} label={v.model} alt={v.model} className="absolute inset-0 w-full h-full"
          imgClassName="object-cover w-full h-full transition-transform duration-700 group-hover:scale-[1.08]" />
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-black/40">{v.year} · {v.make}</p>
          <h4 className="font-display uppercase text-xl leading-none mt-1 group-hover:text-gold transition-colors">{v.model}</h4>
        </div>
        <span className="font-display text-lg tabular-nums">{fmtMoney(v.pricePerDay)}/добу</span>
      </div>
    </a>
  );
}

function VehiclePage() {
  const vehicleId = new URLSearchParams(location.search).get('id');
  const [v, setVehicle] = useState(null);
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [similar, setSimilar] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    setVehicleLoading(true);
    setVehicleError('');
    fetch('/api/v1/vehicles/' + encodeURIComponent(vehicleId || ''), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 404 ? 'Автомобіль не знайдено.' : 'Не вдалося завантажити дані автомобіля.');
        return data;
      })
      .then(setVehicle)
      .catch((error) => { if (!controller.signal.aborted && error.name !== 'AbortError') setVehicleError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setVehicleLoading(false); });
    return () => controller.abort();
  }, [vehicleId, retry]);
  useEffect(() => {
    if (!v) return;
    const controller = new AbortController();
    getVehicleCatalog()
      .then((vehicles) => {
        if (controller.signal.aborted) return;
        setSimilar(vehicles.filter((item) => item.id !== v.id && item.category === v.category)
          .concat(vehicles.filter((item) => item.id !== v.id && item.category !== v.category)).slice(0, 3));
      })
      .catch((error) => { if (error.name !== 'AbortError') setSimilar([]); });
    return () => controller.abort();
  }, [v]);

  useEffect(() => {
    if (!v) return;
    const title = `${v.make} ${v.model} ${v.year} — RentCar UA`;
    const description = `${v.make} ${v.model}: характеристики та попередній тариф ${fmtMoney(v.pricePerDay)} за добу. Доступність і остаточні умови підтверджуються окремо.`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    const canonicalUrl = new URL(`Vehicle.html?id=${encodeURIComponent(v.id)}`, `${window.location.origin}/`).href;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    const setMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('property', property); document.head.appendChild(meta); }
      meta.setAttribute('content', content);
    };
    setMeta('og:url', canonicalUrl);
    setMeta('og:image', new URL(IMG(v.img), `${window.location.origin}/`).href);
    setMeta('og:image:alt', `${v.make} ${v.model}`);
  }, [v]);
  if (vehicleLoading) return <><Navbar base="index.html" /><main role="status" className="min-h-[65vh] bg-[#0a0a0a] text-white grid place-items-center pt-24">Завантажуємо дані авто…</main><Footer base="index.html" /></>;
  if (!v) return (
    <React.Fragment>
      <Navbar base="index.html" />
      <main className="min-h-[70vh] bg-[#0a0a0a] text-white grid place-items-center px-5 pt-28 pb-16">
        <div className="text-center max-w-lg"><span className="kicker is-centered text-gold mb-5">Автомобіль недоступний</span><h1 className="font-display uppercase text-4xl md:text-6xl">{vehicleError || 'Дані авто не знайдено.'}</h1>{vehicleError && !vehicleError.includes('не знайдено') && <button type="button" className="btn btn-ghost mt-7 mr-2" onClick={() => setRetry((n) => n + 1)}>Спробувати знову</button>}<CTAButton href="Inventory.html" className="mt-7">Відкрити каталог</CTAButton></div>
      </main>
      <Footer base="index.html" />
    </React.Fragment>
  );
  const facts = [
    ['Привід', v.drive], ['Паливо', v.fuel],
    ['Коробка', v.transmission], ['Місць', v.seats],
    ['Багажник', v.trunk + ' л'], ['Локація', v.location],
    ...(v.bodyType ? [['Тип кузова', v.bodyType]] : []),
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* галерея + інфо */}
      <section className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          {/* хлібні крихти */}
          <div className="flex items-center gap-2 text-xs text-white/40 mb-7">
            <a href="index.html" className="hover:text-white transition-colors">Головна</a>
            <span>/</span>
            <a href="Inventory.html" className="hover:text-white transition-colors">Каталог</a>
            <span>/</span>
            <span className="text-white/70">{v.make} {v.model}</span>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-14 items-start">
            <Gallery v={v} />

            {/* інфо */}
            <div className="lg:sticky lg:top-24">
              <span className="kicker text-gold mb-4">{v.year} · {v.category} · наявність за датами уточнюється</span>
              <p className="text-white/45 text-sm tracking-[0.16em] uppercase mb-1.5">{v.make}</p>
              <h1 className="font-display uppercase leading-[0.88] text-[46px] md:text-[64px] tracking-[0.01em]">{v.model}</h1>
              <p className="text-white/50 mt-2">{v.trim} · {v.color}</p>

              <div className="mt-7 pt-7 border-t border-white/10 flex items-end justify-between">
                <div>
                  <p className="text-white/45 text-xs tracking-[0.16em] uppercase mb-1">Тариф за добу</p>
                  <p className="font-display text-4xl md:text-5xl tabular-nums">{fmtMoney(v.pricePerDay)}</p>
                </div>
                <div className="text-white/50 text-xs tabular-nums pb-1 text-right"><p>{fmtMoney(v.pricePerWeek)} / тиждень</p><p className="mt-1">{fmtMoney(v.pricePerMonth)} / місяць</p></div>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <CTAButton variant="primary" href={'Service.html?car=' + encodeURIComponent(v.id)} className="w-full" style={{ width: '100%' }}>Подати заявку на це авто</CTAButton>
                <p className="text-white/45 text-xs leading-relaxed">Заявка не є підтвердженням бронювання. Контакти підтримки ще не надані.</p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-px bg-white/10 border border-white/10 rounded overflow-hidden">
                {facts.map(([k, val]) => (
                  <div key={k} className="bg-[#0a0a0a] px-4 py-3.5">
                    <p className="text-white/40 text-[10px] tracking-[0.16em] uppercase">{k}</p>
                    <p className="text-sm font-medium mt-1 tabular-nums">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* spec band */}
      <section className="bg-[#0a0a0a] text-white pb-20 md:pb-28">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-white/45 mb-6">Характеристики</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded overflow-hidden">
            <SpecCell label="Потужність"><CountUp end={v.hp} suffix=" к.с." /></SpecCell>
            <SpecCell label="0–100 км/год"><CountUp end={v.zeroHundred} decimals={1} suffix="с" /></SpecCell>
            <SpecCell label="Макс. швидкість"><CountUp end={v.topSpeed} suffix=" км/год" /></SpecCell>
            <SpecCell label="Пробіг"><CountUp end={v.km} suffix=" км" /></SpecCell>
          </div>
        </div>
      </section>

      {/* опис + калькулятор */}
      <section className="bg-[#F4F2ED] text-black py-20 md:py-28">
        <div className="w-[90%] max-w-[1300px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <span className="kicker text-black/45 mb-5">Огляд</span>
            <h2 className="font-display uppercase text-[36px] md:text-[52px] leading-[0.9] mb-6">{v.color}<br />{v.model}.</h2>
            <p className="text-black/60 text-base md:text-lg leading-relaxed mb-8 max-w-[480px]">
              У каталозі наведені характеристики та попередній тариф для {v.year} {v.make} {v.model}. Фактичний стан, комплектацію й доступність має підтвердити оператор.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-[480px]">
              {['Характеристики з каталогу', 'Тариф попередній', 'Доступність уточнюється', 'Умови видачі не підтверджені'].map((f) => (
                <div key={f} className="flex items-center gap-2.5 py-2 border-b border-black/10">
                  <Icon name="check" size={16} className="text-gold shrink-0" />
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <VehicleTariffs v={v} />
        </div>
      </section>

      {/* схожі авто */}
      {similar.length > 0 && <section className="bg-white text-black py-20 md:py-28">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-display uppercase text-[34px] md:text-[56px] leading-[0.9]">Схожі<br />авто</h2>
            <a href="Inventory.html" className="hidden md:inline-flex rule-grow items-center gap-2 text-sm font-medium text-black/70 hover:text-black pb-0.5">
              Дивитись усі <Icon name="arrowRight" size={16} />
            </a>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {similar.map((s) => <SimilarCard key={s.id} v={s} />)}
          </div>
        </div>
      </section>}

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VehiclePage />);
