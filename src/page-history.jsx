/* ===== Історія оренди — сторінка кабінету користувача (RentCar UA) ===== */

const RENTALS = [];

function HistoryPage() {
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('rentals');

  const filteredList = RENTALS.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            В дорозі
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/15">
            ✓ Завершено
          </span>
        );
      case 'upcoming':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Очікує подачі
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <Navbar base="index.html" />

      {/* Profile Header */}
      <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-12 border-b border-white/10">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/20 border-2 border-gold grid place-items-center text-gold font-display text-2xl md:text-3xl">
                —
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display text-2xl md:text-4xl uppercase tracking-wide">Історія бронювань</h1>
                </div>
                <p className="text-white/50 text-xs md:text-sm">
                  Особистий кабінет і автентифікація ще не підключені.
                </p>
              </div>
            </div>

            {/* Quick user metrics */}
            <div className="flex items-center gap-4 sm:gap-6 bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-center px-2">
                <span className="text-white/40 text-[11px] uppercase tracking-wider block">Поїздок</span>
                <span className="font-display text-2xl text-white">—</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <span className="text-white/40 text-[11px] uppercase tracking-wider block">Бонуси</span>
                <span className="font-display text-2xl text-gold">—</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <span className="text-white/40 text-[11px] uppercase tracking-wider block">Стаж</span>
                <span className="font-display text-2xl text-white">—</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-[#0e0e0e] text-white py-12 md:py-20 min-h-[60vh]">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'Усі поїздки' },
                { id: 'active', label: 'Активні (0)' },
                { id: 'completed', label: 'Завершені (0)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={
                    'px-4 py-2 rounded text-xs uppercase tracking-wider font-medium transition-all ' +
                    (filter === t.id
                      ? 'bg-gold text-black font-semibold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5')
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <a
              href="Inventory.html"
              className="btn btn-primary text-xs py-2 px-4 self-start sm:self-auto"
              style={{ height: '38px' }}
            >
              + Забронювати авто
            </a>
          </div>

          {/* Bookings List */}
          <div className="space-y-6">
            {filteredList.map((rental) => (
              <div
                key={rental.id}
                className="bg-[#141414] border border-white/10 rounded-lg p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-white/20 transition-all shadow-lg"
              >
                {/* Left: Car info + photo */}
                <div className="flex items-center gap-5 sm:gap-6 w-full lg:w-auto">
                  <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                    <SmartImg src={IMG(rental.img)} alt={rental.model} label={rental.model} sizes="144px" className="absolute inset-0 w-full h-full" imgClassName="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-white/40 text-xs font-mono">{rental.id}</span>
                      {getStatusBadge(rental.status)}
                    </div>
                    <h3 className="font-display uppercase text-xl sm:text-2xl leading-tight">
                      {rental.make} {rental.model}
                    </h3>
                    <p className="text-white/50 text-xs sm:text-sm mt-1">
                      {rental.startDate} — {rental.endDate} ({rental.days} {rental.days === 1 ? 'день' : rental.days < 5 ? 'дні' : 'днів'})
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Локація: {rental.location}
                    </p>
                  </div>
                </div>

                {/* Center: Extras & Deposit */}
                <div className="w-full lg:w-auto lg:border-x lg:border-white/10 lg:px-8 py-2">
                  <div className="text-xs text-white/50 mb-1">Опції у замовленні:</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {rental.extras.map((ex, i) => (
                      <span key={i} className="text-[11px] bg-white/5 px-2 py-0.5 rounded text-white/80 border border-white/5">
                        {ex}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-white/50">
                    Застава: <span className="text-white font-medium">{rental.deposit.toLocaleString('uk-UA')} ₴</span>
                    <span className="text-white/40 block text-[11px]">{rental.depositStatus}</span>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-4 w-full lg:w-auto shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-white/40 uppercase tracking-wider block">Разом до сплати</span>
                    <span className="font-display text-2xl md:text-3xl text-gold">
                      {rental.total.toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={`Service.html?car=${rental.carId}`}
                      className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                    >
                      Повторити
                    </a>
                  </div>
                </div>

              </div>
            ))}
            {filteredList.length === 0 && (
              <div className="border border-white/10 rounded-lg p-8 text-center">
                <p className="text-white/80">Немає бронювань для показу.</p>
                <p className="text-white/45 text-sm mt-2">Для перегляду історії потрібен захищений особистий кабінет, який поки не підключено.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<HistoryPage />);
