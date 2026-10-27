/* ===== Каталог — секція на головній сторінці (RentCar UA) ===== */

function Inventory() {
  const gridRef = useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    getVehicleCatalog()
      .then((data) => { if (!controller.signal.aborted) setVehicles(data); })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (!window.gsap || !gridRef.current || PREFERS_REDUCED_MOTION) return;
    const items = gridRef.current.querySelectorAll('[data-inv-item]');
    const ctx = gsap.context(() => {
      items.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 90, filter: 'blur(10px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.85, ease: 'power3.out',
            scrollTrigger: { trigger: gridRef.current, start: 'top 82%', once: true },
            delay: parseFloat(el.dataset.i) * 0.06,
          }
        );
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  const categories = [...new Set(vehicles.map((vehicle) => vehicle.category))];
  const orderedCategories = categories.includes('Спорт') ? ['Спорт', ...categories.filter((category) => category !== 'Спорт')] : categories;
  const inventoryCategories = [...orderedCategories.map((category, index) => ({
    label: category === 'Позашляховик' ? 'Позашляховики' : category === 'Пікап' ? 'Пікапи' : category,
    category,
    feature: index === 0,
  })), { label: 'Усі авто', category: 'Усі' }];
  const cards = inventoryCategories.map((category) => {
    const matches = category.category === 'Усі' ? vehicles : vehicles.filter((v) => v.category === category.category);
    return { ...category, vehicles: matches, count: matches.length,
      from: matches.length ? fmtMoney(Math.min(...matches.map((v) => v.pricePerDay))) + '/добу' : null,
      img: matches[0] ? IMG(matches[0].img) : 'assets/images/showroom-dusk.jpg' };
  }).filter((category) => category.count > 0);
  const feature = cards.find((item) => item.feature) || cards[0];
  const rest = cards.filter((item) => item !== feature);
  const catalogHref = (item) => item.category === 'Усі' ? 'Inventory.html' : 'Inventory.html?' + new URLSearchParams({ category: item.category }).toString();

  return (
    <section id="inventory" className="bg-white py-20 md:py-28 flex justify-center">
      <div className="w-[90%] max-w-[1200px]">
        {/* заголовок */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <span className="kicker text-black/45 mb-4">Каталог автомобілів</span>
            <h2 className="font-display uppercase text-black leading-[0.88] text-[44px] md:text-[76px] tracking-[0.005em]">
              Знайдіть<br />свій клас авто
            </h2>
            <p className="text-black/50 text-sm mt-4 max-w-md">Склад автопарку та тарифи потрібно підтвердити у компанії перед бронюванням.</p>
          </div>
          <a href="Inventory.html" className="hidden md:inline-flex rule-grow items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors group pb-0.5">
            Весь автопарк
            <Icon name="arrowRight" size={17} className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>

        <div ref={gridRef}>
          {loading && <p role="status" className="py-12 text-center text-black/55">Завантажуємо каталог…</p>}
          {!loading && loadError && <div className="py-12 text-center"><p role="alert" className="text-rose-700">{loadError}</p><button type="button" className="btn btn-dark mt-5" onClick={() => setRetry((value) => value + 1)}>Спробувати знову</button></div>}
          {!loading && !loadError && !feature && <div className="py-12 text-center text-black/55">Автомобілів поки немає в каталозі. <a className="underline" href="Inventory.html">Перевірити каталог</a></div>}
          {!loading && !loadError && feature && <>
          {/* виділений банер */}
          <a
            href={catalogHref(feature)}
            data-inv-item data-i="0"
            className="group relative block w-full overflow-hidden rounded bg-neutral-200
                       h-[340px] sm:h-[440px] lg:h-[520px] mb-3 transition-shadow duration-500
                       hover:shadow-[0_34px_80px_-28px_rgba(0,0,0,0.6)]"
          >
            <SmartImg
              src={feature.img}
              label={feature.label + ' фото'}
              alt={feature.label}
              className="absolute inset-0 w-full h-full"
              imgClassName="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

            {/* верхні чіпи */}
            <div className="absolute top-4 left-4 flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-white/90 bg-black/35 backdrop-blur-md px-2.5 py-1 rounded">
                {feature.count} у каталозі
              </span>
            </div>

            {/* нижній контент */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-9 flex items-end justify-between gap-6">
              <div>
                <p className="font-display text-base text-white/45 tabular-nums leading-none mb-2">01</p>
                <h3 className="font-display uppercase text-white leading-[0.9] text-[44px] sm:text-[58px] md:text-[76px] tracking-[0.01em]">
                  {feature.label}
                </h3>
                <p className="text-white/70 text-sm font-medium tabular-nums mt-2">
                  <span className="text-white/45">від</span> {feature.from}
                </p>
              </div>
              <span className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-black grid place-items-center
                               translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <Icon name="arrowRight" size={20} />
              </span>
            </div>
          </a>

          {/* сітка категорій */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-9 md:gap-y-11 pt-6">
            {rest.map((item, i) => (
              <a
                key={item.label}
                href={catalogHref(item)}
                data-inv-item
                data-i={i + 1}
                className="group block"
              >
                <div className="relative w-full overflow-hidden rounded bg-neutral-200 aspect-[5/6] transition-shadow duration-500 group-hover:shadow-[0_24px_52px_-20px_rgba(0,0,0,0.42)]">
                  <SmartImg
                    src={item.img}
                    label={item.label + ' фото'}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full"
                    imgClassName="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* чіп кількості */}
                  <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-white/90 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded">
                    {item.count} авто
                  </span>
                  {/* hover CTA */}
                  <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white text-black grid place-items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                    <Icon name="arrowRight" size={16} />
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-3.5">
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-[13px] text-black/30 tabular-nums leading-none">0{i + 2}</span>
                    <span className="text-[15px] font-medium tracking-[-0.01em] text-black">{item.label}</span>
                  </p>
                  <p className="text-xs font-medium tabular-nums whitespace-nowrap text-black/55">
                    <span className="text-black/30">від</span> {item.from}
                  </p>
                </div>
              </a>
            ))}
          </div>
          </>}
        </div>
      </div>
    </section>
  );
}

window.Inventory = Inventory;
