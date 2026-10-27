/* ===== Доступність авто — інтерактивний календар та timeline (RentCar UA) ===== */

function Availability() {
  const [selectedBody, setSelectedBody] = useState('Усі');
  const [hoveredCar, setHoveredCar] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/v1/availability', { signal: controller.signal }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'Не вдалося отримати календар доступності.');
        return data;
      }),
      getVehicleCatalog(),
    ]).then(([calendar, catalog]) => {
      if (controller.signal.aborted) return;
      setAvailability(calendar);
      setVehicles(catalog);
    }).catch((error) => { if (error.name !== 'AbortError') setAvailabilityError(error.message); });
    return () => controller.abort();
  }, []);

  const categories = ['Усі', ...new Set(vehicles.map((vehicle) => vehicle.category))];

  const filteredVehicles = selectedBody === 'Усі'
    ? vehicles
    : vehicles.filter((v) => v.category === selectedBody);

  return (
    <section id="availability" className="bg-[#0e0e0e] text-white py-20 md:py-28 border-t border-white/10 relative overflow-hidden">
      {/* фоновий акцент */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-[92%] max-w-[1300px] mx-auto relative z-10">
        
        {/* заголовок та фільтри */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="kicker text-gold mb-3">Календар автопарку</span>
            <h2 className="font-display uppercase leading-[0.92] text-[40px] md:text-[68px] tracking-[0.005em]">
              Доступність авто<br /><span className="text-white/40">на 14 днів</span>
            </h2>
          </div>

          {/* Легенда */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-white/60 bg-white/5 px-4 py-3 rounded border border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span>Вільне</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span>Заброньовано</span>
            </div>
          </div>
        </div>

        {/* фільтри категорій */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={selectedBody === c}
              onClick={() => setSelectedBody(c)}
              className={
              'px-4 min-h-11 rounded text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap ' +
                (selectedBody === c
                  ? 'bg-gold text-black font-semibold shadow-[0_0_15px_rgba(200,155,74,0.3)]'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5')
              }
            >
              {c}
            </button>
          ))}
        </div>

        {/* Timeline Таблиця */}
        <div className="bg-[#141414] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
          <div className="overflow-x-auto" role="region" aria-label="Календар доступності автомобілів на 14 днів. Прокручуйте по горизонталі." tabIndex={0}>
            <div className="min-w-[900px]" role="table" aria-rowcount={filteredVehicles.length + 1} aria-colcount={15}>
              
              {/* Шапка днів */}
              <div role="row" className="grid grid-cols-[280px_repeat(14,1fr)] bg-white/5 border-b border-white/10 text-center py-3">
                <div role="columnheader" className="text-left px-5 text-xs uppercase tracking-wider text-white/50 font-medium self-center">
                  Автомобіль / Тариф
                </div>
                {(availability?.days || []).map((d, idx) => (
                  <div key={idx} role="columnheader" aria-label={`${d.weekday}, ${d.date}`} className={'px-1 py-1 rounded ' + (d.isToday ? 'bg-gold/15 text-gold font-bold' : 'text-white/70')}>
                    <div className="text-[10px] uppercase tracking-wide">{d.weekday}</div>
                    <div className="text-sm font-display">{d.day}</div>
                    {d.isToday && <span className="block text-[8px] uppercase tracking-tighter text-gold">Сьогодні</span>}
                  </div>
                ))}
              </div>

              {/* Рядки авто */}
              <div role="rowgroup" className="divide-y divide-white/5">
                {!availability && <div className="p-8 text-center text-white/50">{availabilityError || 'Завантажуємо календар…'}</div>}
                {availability && filteredVehicles.map((v) => {
                  const schedule = availability?.schedules?.[v.id] || [];
                  const isAvailableNow = schedule[0] === 1;

                  return (
                    <div
                      key={v.id}
                      role="row"
                      onMouseEnter={() => setHoveredCar(v.id)}
                      onMouseLeave={() => setHoveredCar(null)}
                      className={
                        'grid grid-cols-[280px_repeat(14,1fr)] items-center py-3.5 px-2 transition-colors ' +
                        (hoveredCar === v.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]')
                      }
                    >
                      {/* Ліва колонка — інфо про авто */}
                      <div role="rowheader" className="px-3 flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                          <SmartImg src={IMG(v.img)} alt={`${v.make} ${v.model}`} className="w-full h-full" imgClassName="w-full h-full object-cover" />
                          <span aria-hidden="true"
                            className={
                              'absolute top-1 right-1 w-2 h-2 rounded-full ' +
                              (isAvailableNow ? 'bg-emerald-500' : 'bg-rose-500')
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <a href={`Vehicle.html?id=${encodeURIComponent(v.id)}`} className="font-display uppercase text-base hover:text-gold transition-colors block truncate">
                            {v.make} {v.model}
                          </a>
                          <div className="text-xs text-white/50 flex items-center gap-2">
                            <span className="text-gold font-medium">{v.pricePerDay.toLocaleString('uk-UA')} ₴/добу</span>
                            <span>•</span>
                            <span className="truncate">{v.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* 14 днів клітинок */}
                      {schedule.map((status, sIdx) => {
                        const isFree = status === 1;
                        return (
                        <div key={sIdx} role="cell" aria-label={`${v.make} ${v.model}, ${availability?.days?.[sIdx]?.date || ''}: ${isFree ? 'вільне' : 'зайняте'}`} className="px-1 text-center">
                            <div
                              title={isFree ? 'Вільне для оренди' : 'Заброньовано'}
                              className={
                              'h-8 rounded flex items-center justify-center transition-all ' +
                                (isFree
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/35 hover:scale-105'
                                  : 'bg-rose-500/15 text-rose-400/60 border border-rose-500/20')
                              }
                            >
                              {isFree ? (
                                <span aria-hidden="true" className="text-[11px] font-bold">✓</span>
                              ) : (
                                <span aria-hidden="true" className="text-[10px]">✕</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {availability && filteredVehicles.length === 0 && <p className="p-8 text-center text-white/50">Для цієї категорії немає автомобілів.</p>}
              </div>

            </div>
          </div>

          {/* Підвал таблиці з діями */}
          <div className="p-4 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <span>{availabilityError ? 'Календар недоступний.' : 'Перед оформленням заявку та доступність підтверджує оператор.'}</span>
            <div className="flex items-center gap-3">
              <a href="Inventory.html" className="text-white hover:text-gold transition-colors font-medium">
                Повний каталог авто →
              </a>
              <a href="Service.html" className="btn btn-primary text-xs py-2 px-4" style={{ height: '36px' }}>
                Швидке бронювання
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

window.Availability = Availability;
