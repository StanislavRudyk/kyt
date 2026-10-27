/* ===== Попередній розрахунок за серверним тарифом ===== */

function Financing() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [days, setDays] = useState(7);
  const [catalogError, setCatalogError] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getVehicleCatalog()
      .then((data) => { if (!controller.signal.aborted) { setVehicles(data); if (data.length) setVehicleId(data[0].id); } })
      .catch((error) => { if (!controller.signal.aborted) setCatalogError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!vehicleId) { setQuote(null); return undefined; }
    const controller = new AbortController();
    setCalculating(true); setQuoteError(''); setQuote(null);
    fetch('/api/v1/tariffs/calculate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, days }), signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Не вдалося розрахувати суму.');
      return data;
    }).then(setQuote)
      .catch((error) => { if (error.name !== 'AbortError') setQuoteError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setCalculating(false); });
    return () => controller.abort();
  }, [vehicleId, days]);

  const money = (amount) => Math.round(amount || 0).toLocaleString('uk-UA') + ' ₴';
  const pct = ((days - 1) / 89) * 100;

  return (
    <section id="calculator" className="bg-[#F4F2ED] text-black py-20 md:py-28">
      <div className="w-[90%] max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Reveal>
          <span className="kicker text-black/45 mb-5">Попередній розрахунок</span>
          <h2 className="font-display uppercase leading-[0.9] text-[44px] md:text-[68px] tracking-[0.005em] mb-6">Розрахуйте<br />тариф авто.</h2>
          <p className="text-black/55 text-base leading-relaxed max-w-[440px] mb-10">Суму повертає сервер за тарифом вибраного автомобіля. Остаточні правила оренди має підтвердити компанія.</p>
          {catalogError && <p role="alert" className="text-rose-700">{catalogError}</p>}
          {loading && <p role="status" className="text-black/55">Завантажуємо каталог…</p>}
          {!loading && !catalogError && vehicles.length === 0 && <p className="text-black/55">У каталозі поки немає автомобілів для розрахунку.</p>}
          {!loading && vehicles.length > 0 && <div className="space-y-7 max-w-[480px]">
            <div><label htmlFor="tariff-vehicle" className="block text-sm font-medium text-black/70 mb-2">Автомобіль</label><select id="tariff-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="field w-full">{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} · {money(vehicle.pricePerDay)}/добу</option>)}</select></div>
            <div><div className="flex items-baseline justify-between mb-3"><label htmlFor="tariff-days" className="text-sm font-medium text-black/70">Календарні дні</label><output htmlFor="tariff-days" className="font-display text-xl tabular-nums">{days}</output></div><input id="tariff-days" type="range" className="range w-full" min="1" max="90" step="1" value={days} aria-valuetext={`${days} календарних днів`} onChange={(event) => setDays(Number(event.target.value))} style={{ background: `linear-gradient(90deg, var(--gold) ${pct}%, rgba(0,0,0,0.14) ${pct}%) center / 100% 2px no-repeat` }} /></div>
          </div>}
        </Reveal>
        <Reveal variant="reveal-right" delay={120}>
          <div className="card-elev text-white rounded p-8 md:p-11" aria-live="polite">
            <p className="text-white/45 text-xs tracking-[0.2em] uppercase mb-4">Попередня сума</p>
            {calculating && <p role="status" className="text-white/55 py-6">Розраховуємо на сервері…</p>}
            {quoteError && <p role="alert" className="text-rose-300 py-6">{quoteError}</p>}
            {!calculating && quote && <><p className="font-display text-[60px] md:text-[88px] leading-[0.85] tabular-nums">{money(quote.totalCost)}</p><p className="text-white/40 text-sm mt-3">{quote.days} {quote.days === 1 ? 'доба' : 'діб'} · {money(quote.dailyRate)} за добу</p><div className="border-t border-white/10 mt-7 pt-6 space-y-3"><Row label="Тариф авто × календарні дні" value={money(quote.baseTotal)} /><Row label="Знижки" value="Не налаштовані" /><Row label="Страхування / доппослуги" value="Не налаштовані" /><Row label="Податки / інші збори" value="Не налаштовані" /></div><p className="text-white/40 text-xs mt-6">{quote.pricingNote}</p><CTAButton variant="primary" href="Service.html" className="w-full mt-7" style={{ width: '100%' }}>Перейти до заявки</CTAButton></>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-white/50 text-sm">{label}</span><span className="font-medium tabular-nums text-right">{value}</span></div>;
}

window.Financing = Financing;
