const DEMO_ADMIN_KEY = 'rentcar-demo-admin-course-key';

function moneyUAH(value) {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value || 0);
}

function dateTimeUA(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' }).format(new Date(value));
}

function AdminConsole() {
  const [key, setKey] = React.useState(() => sessionStorage.getItem('rentcar.demo-admin-key') || DEMO_ADMIN_KEY);
  const [bookings, setBookings] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const api = async (path, options = {}) => {
    const response = await fetch(`/api/v1/admin${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-Demo-Admin-Key': key.trim(), ...(options.headers || {}) },
    });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof body === 'object' ? (body.detail || 'Помилка запиту') : 'Не вдалося виконати запит');
    return body;
  };

  const refresh = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      sessionStorage.setItem('rentcar.demo-admin-key', key.trim());
      const data = await api('/bookings');
      setBookings(data.items || []);
    } catch (err) { setError(err.message || 'Не вдалося завантажити заявки'); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { refresh(); }, []);

  const transition = async (booking, status) => {
    const action = `${booking.id}:${status}`;
    setBusy(action); setError(''); setMessage('');
    try {
      await api(`/bookings/${encodeURIComponent(booking.id)}/status`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      await refresh();
      setMessage(`Заявку ${booking.id} оновлено: ${({ confirmed: 'підтверджено', paid: 'демо-оплату зафіксовано', active: 'автомобіль видано', completed: 'оренду завершено', cancelled: 'скасовано' })[status]}.`);
    } catch (err) { setError(err.message || 'Не вдалося змінити статус'); }
    finally { setBusy(''); }
  };

  const printContract = async (booking) => {
    setBusy(`${booking.id}:contract`); setError('');
    try {
      const html = await api(`/bookings/${encodeURIComponent(booking.id)}/contract`);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const tab = window.open(url, '_blank');
      if (!tab) throw new Error('Дозвольте спливні вікна, щоб відкрити демо-договір.');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.message || 'Не вдалося сформувати договір'); }
    finally { setBusy(''); }
  };

  const printReceipt = async (booking) => {
    setBusy(`${booking.id}:receipt`); setError('');
    try {
      const html = await api(`/bookings/${encodeURIComponent(booking.id)}/receipt`);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const tab = window.open(url, '_blank');
      if (!tab) throw new Error('Дозвольте спливні вікна, щоб відкрити демо-квитанцію.');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.message || 'Не вдалося сформувати квитанцію'); }
    finally { setBusy(''); }
  };

  const visible = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);
  const counts = bookings.reduce((acc, booking) => ({ ...acc, [booking.status]: (acc[booking.status] || 0) + 1 }), {});
  const stages = [
    ['pending', 'Очікують', 'text-amber-200'], ['confirmed', 'Підтверджені', 'text-sky-200'],
    ['paid', 'Оплачені · демо', 'text-emerald-200'], ['active', 'В оренді', 'text-violet-200'],
    ['completed', 'Завершені', 'text-white/50'], ['cancelled', 'Скасовані', 'text-rose-200'],
  ];

  const actionsFor = (booking) => {
    const button = (label, status, style = 'btn btn-ghost') => <button key={status} type="button" disabled={!!busy} className={`${style} !min-h-9 !px-3 !py-2 text-xs`} onClick={() => transition(booking, status)}>{busy === `${booking.id}:${status}` ? 'Оновлюємо…' : label}</button>;
    return <div className="flex flex-wrap gap-2">
      {booking.status === 'pending' && <>{button('Підтвердити', 'confirmed', 'btn btn-primary')}{button('Відхилити', 'cancelled')}</>}
      {booking.status === 'confirmed' && <>{button('Імітувати оплату', 'paid', 'btn btn-primary')}{button('Скасувати', 'cancelled')}</>}
      {['confirmed', 'paid', 'active', 'completed'].includes(booking.status) && <button type="button" disabled={!!busy} className="btn btn-ghost !min-h-9 !px-3 !py-2 text-xs" onClick={() => printContract(booking)}>{busy === `${booking.id}:contract` ? 'Формуємо…' : 'Демо-договір'}</button>}
      {['paid', 'active', 'completed'].includes(booking.status) && <button type="button" disabled={!!busy} className="btn btn-ghost !min-h-9 !px-3 !py-2 text-xs" onClick={() => printReceipt(booking)}>{busy === `${booking.id}:receipt` ? 'Формуємо…' : 'Демо-квитанція'}</button>}
      {booking.status === 'paid' && button('Видати авто', 'active', 'btn btn-primary')}
      {booking.status === 'active' && button('Прийняти авто', 'completed', 'btn btn-primary')}
      {['completed', 'cancelled'].includes(booking.status) && <span className="text-xs text-white/35 self-center">Доступних дій немає</span>}
    </div>;
  };

  return <div className="min-h-screen bg-[#0a0a0a] text-white">
    <header className="border-b border-white/10 pt-10 pb-9 md:pt-16 md:pb-12">
      <div className="w-[92%] max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div><a href="index.html" className="text-xs text-white/45 hover:text-gold">← На сайт</a><p className="kicker text-gold mt-7 mb-3">Навчальний режим · тестові дані</p><h1 className="font-display uppercase text-4xl md:text-6xl">Панель оператора</h1><p className="text-white/50 mt-4 max-w-2xl">Повний цикл заявки: підтвердження, імітація оплати, видача та повернення автомобіля. Дії записуються в історію.</p></div>
        <button type="button" onClick={refresh} disabled={loading} className="btn btn-primary shrink-0">{loading ? 'Оновлюємо…' : 'Оновити заявки'}</button>
      </div>
    </header>
    <main className="w-[92%] max-w-[1440px] mx-auto py-8 md:py-12">
      <div className="border border-amber-300/30 bg-amber-300/5 p-4 md:p-5 mb-8"><p className="font-semibold text-amber-100">Симуляція для курсового проєкту</p><p className="text-sm text-white/55 mt-1">Платіж не надсилається до банку, адреси пунктів і заявки демонстраційні, договір не має юридичної сили.</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">{stages.map(([status, label, color]) => <button key={status} onClick={() => setFilter(filter === status ? 'all' : status)} className={`surface-panel p-4 text-left border ${filter === status ? 'border-gold' : 'border-white/10'}`}><span className="block font-display text-3xl">{counts[status] || 0}</span><span className={`text-xs ${color}`}>{label}</span></button>)}</div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><h2 className="font-display uppercase text-2xl">Заявки <span className="text-white/35">({visible.length})</span></h2><label className="text-sm text-white/50">Фільтр <select className="field !w-auto ml-2" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Усі статуси</option>{stages.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label></div>
      {error && <div role="alert" className="border border-rose-300/30 bg-rose-300/5 text-rose-100 p-4 mb-5">{error}</div>}
      {message && <div role="status" className="border border-emerald-300/30 bg-emerald-300/5 text-emerald-100 p-4 mb-5">{message}</div>}
      {!loading && !bookings.length && !error && <div className="surface-panel p-8 text-center"><p className="font-display uppercase text-2xl">Заявок поки немає</p><p className="text-white/45 mt-2">Створіть тестову заявку через форму оренди — вона з’явиться тут.</p><a href="Service.html" className="btn btn-primary inline-flex mt-6">Створити заявку</a></div>}
      {!loading && visible.length > 0 && <div className="space-y-4">{visible.map((booking) => <article key={booking.id} className="surface-panel border border-white/10 p-5 md:p-7">
        <div className="flex flex-col xl:flex-row xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-2xl">{booking.id}</h3><span className="text-xs border border-white/15 px-2 py-1">{booking.statusLabel}</span><span className="text-xs text-white/35">Створено {dateTimeUA(booking.createdAt)}</span></div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 mt-6">
              <section><p className="text-[11px] uppercase tracking-widest text-gold mb-2">Клієнт</p><p>{booking.customer.name}</p><p className="text-sm text-white/50">{booking.customer.phone}{booking.customer.email ? ` · ${booking.customer.email}` : ''}</p></section>
              <section><p className="text-[11px] uppercase tracking-widest text-gold mb-2">Автомобіль</p><p>{booking.vehicle.make} {booking.vehicle.model}</p><p className="text-sm text-white/50">{booking.days} календарних діб · {moneyUAH(booking.totalAmount)}</p></section>
              <section><p className="text-[11px] uppercase tracking-widest text-gold mb-2">Отримання</p><p>{dateTimeUA(booking.startAt)}</p><p className="text-sm text-white/50">{booking.pickup.name} · {booking.pickup.address}</p></section>
              <section><p className="text-[11px] uppercase tracking-widest text-gold mb-2">Повернення</p><p>{dateTimeUA(booking.endAt)}</p><p className="text-sm text-white/50">{booking.return.name} · {booking.return.address}</p></section>
            </div>
            <details className="mt-5"><summary className="cursor-pointer text-xs text-white/45 hover:text-white">Історія подій ({booking.events.length})</summary><ol className="mt-3 space-y-2 border-l border-white/15 pl-4">{booking.events.map((event, index) => <li key={`${event.type}-${index}`} className="text-xs text-white/55"><span className="text-white/35">{dateTimeUA(event.at)}</span> · {event.note}</li>)}</ol></details>
          </div>
          <aside className="xl:w-64 xl:border-l xl:border-white/10 xl:pl-6 flex flex-col justify-between gap-5"><div><p className="text-[11px] uppercase tracking-widest text-white/40">Застава</p><p className="font-display text-2xl mt-1">{moneyUAH(booking.depositAmount)}</p><p className="text-xs text-emerald-200/70 mt-1">{booking.paymentLabel}</p></div>{actionsFor(booking)}</aside>
        </div>
      </article>)}</div>}
    </main>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminConsole />);
