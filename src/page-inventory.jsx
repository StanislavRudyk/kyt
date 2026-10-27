/* ===== Каталог автопарку — сторінка (RentCar UA) ===== */

const SORTS = ['За назвою', 'Ціна: від меншої', 'Ціна: від більшої', 'Рік: від нового'];

function VehicleCard({ v, i }) {
  return (
    <Reveal delay={(i % 3) * 70}>
      <a href={'Vehicle.html?id=' + encodeURIComponent(v.id)} className="group block">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded bg-neutral-900 transition-shadow duration-500 group-hover:shadow-[0_0_48px_-10px_rgba(200,155,74,0.3)]">
          <SmartImg
            src={IMG(v.img, 1000)}
            label={v.make + ' ' + v.model}
            alt={v.make + ' ' + v.model}
            className="absolute inset-0 w-full h-full"
            imgClassName="object-cover w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="absolute top-3 left-3 text-[10px] font-medium tracking-[0.14em] uppercase text-white/90 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded">Перевірити дати</span>
          <span className="absolute top-3 right-3 text-[10px] font-medium tracking-[0.16em] uppercase text-white/80 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded">{v.category}</span>
          <span className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white text-black grid place-items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
            <Icon name="arrowRight" size={16} />
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] tracking-[0.14em] uppercase text-white/40">{v.year} · {v.make}</p>
            <p className="text-[11px] tracking-[0.14em] uppercase text-white/40 tabular-nums">{v.seats} місць · {v.transmission}</p>
          </div>
          <h3 className="font-display uppercase text-2xl md:text-[28px] leading-none tracking-[0.01em] mt-1.5 group-hover:text-gold transition-colors">{v.model}</h3>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between">
            <span className="font-display text-2xl tabular-nums">{fmtMoney(v.pricePerDay)}</span>
            <span className="text-white/45 text-xs tabular-nums">/добу</span>
          </div>
        </div>
      </a>
    </Reveal>
  );
}

function InventoryPage() {
  const params = new URLSearchParams(location.search);
  const initialCategory = params.get('category') || params.get('body') || 'Усі';
  const [category, setCategory] = useState(initialCategory);
  const [make, setMake] = useState('Усі');
  const [fuel, setFuel] = useState('Усі');
  const [transmission, setTransmission] = useState('Усі');
  const [bodyType, setBodyType] = useState('Усі');
  const [seats, setSeats] = useState('Усі');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState(SORTS[0]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    getVehicleCatalog()
      .then((data) => { if (!controller.signal.aborted) setCatalog(data); })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const makeOptions = [...new Set(catalog.map((vehicle) => vehicle.make))].sort();
  const categoryOptions = [...new Set(catalog.map((vehicle) => vehicle.category))].sort((a, b) => a.localeCompare(b, 'uk'));
  const fuelOptions = [...new Set(catalog.map((vehicle) => vehicle.fuel))].sort();
  const transmissionOptions = [...new Set(catalog.map((vehicle) => vehicle.transmission))].sort();
  const bodyTypeOptions = [...new Set(catalog.map((vehicle) => vehicle.bodyType).filter(Boolean))].sort();
  const seatOptions = [...new Set(catalog.map((vehicle) => vehicle.seats))].sort((a, b) => a - b);
  const minAvailablePrice = catalog.length ? Math.min(...catalog.map((vehicle) => vehicle.pricePerDay)) : 0;
  const maxAvailablePrice = catalog.length ? Math.max(...catalog.map((vehicle) => vehicle.pricePerDay)) : 0;
  const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA');
  const list = catalog.filter((vehicle) =>
    (category === 'Усі' || vehicle.category === category) &&
    (make === 'Усі' || vehicle.make === make) &&
    (fuel === 'Усі' || vehicle.fuel === fuel) &&
    (transmission === 'Усі' || vehicle.transmission === transmission) &&
    (bodyType === 'Усі' || vehicle.bodyType === bodyType) &&
    (seats === 'Усі' || vehicle.seats === Number(seats)) &&
    (!minPrice || vehicle.pricePerDay >= Number(minPrice)) &&
    (!maxPrice || vehicle.pricePerDay <= Number(maxPrice)) &&
    (!normalizedSearch || `${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.toLocaleLowerCase('uk-UA').includes(normalizedSearch))
  );
  list.sort((a, b) => {
    if (sort === 'Ціна: від меншої') return a.pricePerDay - b.pricePerDay;
    if (sort === 'Ціна: від більшої') return b.pricePerDay - a.pricePerDay;
    if (sort === 'Рік: від нового') return b.year - a.year || a.make.localeCompare(b.make, 'uk');
    return a.make.localeCompare(b.make, 'uk') || a.model.localeCompare(b.model, 'uk');
  });
  const filtersActive = category !== 'Усі' || make !== 'Усі' || fuel !== 'Усі' || transmission !== 'Усі' || bodyType !== 'Усі' || seats !== 'Усі' || Boolean(search || minPrice || maxPrice);
  const priceRangeError = minPrice && maxPrice && Number(minPrice) > Number(maxPrice)
    ? 'Мінімальна ціна не може бути більшою за максимальну.' : '';
  const resetFilters = () => { setCategory('Усі'); setMake('Усі'); setFuel('Усі'); setTransmission('Усі'); setBodyType('Усі'); setSeats('Усі'); setSearch(''); setMinPrice(''); setMaxPrice(''); setSort(SORTS[0]); };

  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* заголовок */}
      <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="kicker text-gold mb-5">Автопарк</span>
          <h1 className="font-display uppercase leading-[0.92] text-[48px] md:text-[76px] lg:text-[100px] tracking-[0.005em] pb-1">
            Каталог авто
          </h1>
          <p className="text-white/55 text-base leading-relaxed max-w-[460px] mt-7">
            Каталог завантажується з сервера. Доступність на вибрані дати та умови оренди підтверджуються окремо. Тип кузова показується лише для записів, де він підтверджений.
          </p>
        </div>
      </header>

      {/* панель фільтрів */}
      <div className="bg-[#0a0a0a]/95 text-white sticky top-[56px] z-20 border-y border-white/10 backdrop-blur-md">
        <div className="w-[90%] max-w-[1300px] mx-auto py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            {['Усі', ...categoryOptions].map((b) => (
              <button
                key={b}
                onClick={() => setCategory(b)}
                aria-pressed={category === b}
                className={'shrink-0 px-4 min-h-11 rounded-full text-[13px] font-medium tracking-wide transition-colors duration-200 ' +
                  (category === b ? 'bg-white text-black' : 'text-white/60 hover:text-white border border-white/15')}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!loading && !loadError && <span aria-live="polite" aria-atomic="true" className="hidden sm:inline text-white/40 text-sm tabular-nums">{list.length} {list.length === 1 ? 'результат' : list.length < 5 ? 'результати' : 'результатів'}</span>}
            <div className="relative">
              <label className="sr-only" htmlFor="inventory-sort">Сортування автомобілів</label>
              <select
                id="inventory-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-transparent border border-white/15 rounded-full min-h-11 pl-4 pr-9 text-[13px] font-medium text-white/80 hover:text-white cursor-pointer"
              >
                {SORTS.map((s) => <option key={s} className="bg-[#0a0a0a]" value={s}>{s}</option>)}
              </select>
              <Icon name="sliders" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Фільтри каталогу" className="bg-[#0a0a0a] text-white pb-6">
        <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <label className="sr-only" htmlFor="inventory-search">Пошук за маркою або моделлю</label>
          <input id="inventory-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Марка або модель" className="field col-span-2 md:col-span-4 lg:col-span-2" />
          <FilterSelect id="filter-make" label="Марка" value={make} onChange={setMake} options={makeOptions} />
          <FilterSelect id="filter-fuel" label="Тип пального" value={fuel} onChange={setFuel} options={fuelOptions} />
          <FilterSelect id="filter-transmission" label="Коробка передач" value={transmission} onChange={setTransmission} options={transmissionOptions} />
          <FilterSelect id="filter-seats" label="Кількість місць" value={seats} onChange={setSeats} options={seatOptions.map(String)} />
          {bodyTypeOptions.length > 0 && <FilterSelect id="filter-body-type" label="Тип кузова" value={bodyType} onChange={setBodyType} options={bodyTypeOptions} />}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor="min-price">Мінімальна ціна за добу</label>
            <input id="min-price" type="number" min="0" max={maxAvailablePrice || undefined} inputMode="numeric" value={minPrice} aria-invalid={!!priceRangeError} aria-describedby={priceRangeError ? 'price-range-error' : undefined} onChange={(e) => setMinPrice(e.target.value)} placeholder={`Від ₴${minAvailablePrice || ''}`} className="field min-w-0" />
            <label className="sr-only" htmlFor="max-price">Максимальна ціна за добу</label>
            <input id="max-price" type="number" min="0" max="10000000" inputMode="numeric" value={maxPrice} aria-invalid={!!priceRangeError} aria-describedby={priceRangeError ? 'price-range-error' : undefined} onChange={(e) => setMaxPrice(e.target.value)} placeholder={`До ₴${maxAvailablePrice || ''}`} className="field min-w-0" />
          </div>
          {priceRangeError && <p id="price-range-error" role="alert" className="col-span-2 md:col-span-4 lg:col-span-7 text-sm text-rose-200">{priceRangeError}</p>}
        </div>
        {!loading && !loadError && filtersActive && <div className="w-[90%] max-w-[1300px] mx-auto mt-3 flex justify-end"><button type="button" onClick={resetFilters} className="min-h-11 px-3 text-sm text-white/70 underline hover:text-white">Скинути фільтри</button></div>}
      </section>

      {/* сітка */}
      <section className="bg-[#0a0a0a] text-white pt-10 md:pt-14 pb-24 md:pb-32 min-h-[60vh]">
        <div className="w-[90%] max-w-[1300px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {list.map((v, i) => <VehicleCard key={v.id} v={v} i={i} />)}
        </div>
        {loading && <p role="status" className="text-center text-white/55 mt-16">Завантажуємо каталог…</p>}
        {!loading && loadError && <div className="text-center mt-16"><p role="alert" className="text-rose-300">{loadError}</p><button className="btn btn-ghost mt-5" onClick={() => setReload((value) => value + 1)}>Спробувати знову</button></div>}
        {!loading && !loadError && list.length === 0 && (
          <div className="text-center mt-16"><p className="text-white/55">Автомобілів за цими фільтрами немає.</p><button type="button" className="btn btn-ghost mt-5" onClick={resetFilters}>Скинути фільтри</button><a href="index.html#inventory" className="block mt-4 text-sm text-gold underline">Переглянути категорії на головній</a></div>
        )}
      </section>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

function FilterSelect({ id, label, value, onChange, options }) {
  return <div className="min-w-0"><label className="sr-only" htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="field w-full min-w-0"><option value="Усі">{label}: усі</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<InventoryPage />);
