/* ===== Заявка на оренду: серверні локації, доступність і розрахунок ===== */

function localDateForZone(zone) {
  if (!zone) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function displayAt(utcValue, zone) {
  if (!utcValue || !zone) return '—';
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: zone, dateStyle: 'medium', timeStyle: 'short', hour12: false,
  }).format(new Date(utcValue));
}

function BookingPage() {
  const requestedCar = new URLSearchParams(window.location.search).get('car');
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState('');
  const [carsRetry, setCarsRetry] = useState(0);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState('');
  const [locationsRetry, setLocationsRetry] = useState(0);
  const [selectedCar, setSelectedCar] = useState(requestedCar || '');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [returnLocationId, setReturnLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [step, setStep] = useState(0);
  const [periodAttempted, setPeriodAttempted] = useState(false);
  const [stepError, setStepError] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [contactAttempted, setContactAttempted] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const controller = new AbortController();
    setCarsLoading(true);
    setCarsError('');
    getVehicleCatalog()
      .then((data) => { if (!controller.signal.aborted) setCars(data); })
      .catch((error) => { if (!controller.signal.aborted) setCarsError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setCarsLoading(false); });
    return () => controller.abort();
  }, [carsRetry]);

  useEffect(() => {
    const controller = new AbortController();
    setLocationsError('');
    fetch('/api/v1/locations', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'Не вдалося завантажити пункти видачі.');
        if (!Array.isArray(data)) throw new Error('Сервер повернув некоректний список пунктів.');
        return data;
      })
      .then((data) => { setLocations(data); if (data.length && !pickupLocationId) { setPickupLocationId(data[0].id); setReturnLocationId(data[0].id); } })
      .catch((error) => { if (error.name !== 'AbortError') setLocationsError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLocationsLoading(false); });
    return () => controller.abort();
  }, [locationsRetry]);

  const car = cars.find((item) => item.id === selectedCar) || null;
  const eligibleLocations = locations.filter((item) => item.vehicleIds.includes(selectedCar));
  const pickupLocation = eligibleLocations.find((item) => item.id === pickupLocationId) || null;
  const returnLocation = eligibleLocations.find((item) => item.id === returnLocationId) || null;
  const requestData = { vehicleId: selectedCar, pickupLocationId, returnLocationId, startDate, startTime, endDate, endTime };
  const requestKey = JSON.stringify(requestData);
  const quoteMatches = Boolean(quote && quote.requestKey === requestKey);
  const nameValid = name.trim().length >= 2;
  const nameError = contactAttempted && !nameValid ? 'Вкажіть ім’я щонайменше з двох символів.' : '';
  const phoneValid = /^\+?[0-9 ()-]{7,30}$/.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7;
  const phoneError = contactAttempted && !phoneValid ? 'Введіть номер телефону щонайменше з 7 цифрами.' : '';
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError = contactAttempted && !emailValid ? 'Перевірте формат email або залиште поле порожнім.' : '';
  const privacyError = contactAttempted && !privacyAcknowledged ? 'Потрібно підтвердити ознайомлення з інформацією про обробку даних.' : '';
  const contactValid = nameValid && phoneValid && emailValid && privacyAcknowledged;
  const dateOrderValid = startDate && startTime && endDate && endTime && `${endDate}T${endTime}` > `${startDate}T${startTime}`;
  const datesComplete = Boolean(startDate && startTime && endDate && endTime);
  const invalidDateOrder = Boolean(periodAttempted && datesComplete && !dateOrderValid);
  const pickupDateError = periodAttempted && !startDate ? 'Оберіть дату отримання.'
    : periodAttempted && pickupLocation && startDate && startDate < localDateForZone(pickupLocation.timeZone) ? 'Дата отримання не може бути в минулому.' : '';
  const pickupTimeError = periodAttempted && !startTime ? 'Оберіть час отримання.' : '';
  const returnDateError = periodAttempted && !endDate ? 'Оберіть дату повернення.'
    : invalidDateOrder ? 'Повернення має бути пізніше за отримання.' : '';
  const returnTimeError = periodAttempted && !endTime ? 'Оберіть час повернення.'
    : invalidDateOrder ? 'Повернення має бути пізніше за отримання.' : '';
  const pickupLocationError = periodAttempted && !pickupLocationId ? 'Оберіть пункт отримання.' : '';
  const returnLocationError = periodAttempted && !returnLocationId ? 'Оберіть пункт повернення.' : '';

  useEffect(() => {
    if (!selectedCar || !locations.length) return;
    const allowed = locations.filter((item) => item.vehicleIds.includes(selectedCar));
    setPickupLocationId((current) => allowed.some((item) => item.id === current) ? current : allowed[0]?.id || '');
    setReturnLocationId((current) => allowed.some((item) => item.id === current) ? current : allowed[0]?.id || '');
    invalidateQuote();
  }, [selectedCar, locations]);

  const invalidateQuote = () => { setQuote(null); setQuoteError(''); setStepError(''); setBookingError(''); };
  const checkPeriod = async () => {
    setPeriodAttempted(true);
    setQuote(null);
    setQuoteError('');
    setStepError('');
    if (!selectedCar || !car) return setQuoteError('Спочатку оберіть автомобіль із каталогу.');
    if (!pickupLocation || !returnLocation) {
      setQuoteError('Оберіть пункт отримання та повернення зі списку.');
      document.getElementById(!pickupLocation ? 'pickup-location' : 'return-location')?.focus();
      return;
    }
    if (!datesComplete || !dateOrderValid) {
      setQuoteError(!datesComplete ? 'Заповніть дату й час отримання та повернення.' : 'Повернення має бути пізніше за отримання. Перевірте дати й час.');
      const firstInvalid = !startDate ? 'pickup-date' : !startTime ? 'pickup-time' : !endDate ? 'return-date' : 'return-time';
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    if (startDate < localDateForZone(pickupLocation.timeZone)) {
      setQuoteError('Дата отримання не може бути в минулому за місцевим часом пункту.');
      document.getElementById('pickup-date')?.focus();
      return;
    }
    setChecking(true);
    try {
      const response = await fetch('/api/v1/bookings/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Не вдалося перевірити період.');
      setQuote({ ...data, requestKey });
    } catch (error) {
      setQuoteError(error.message || 'Сервер доступності тимчасово недоступний. Спробуйте ще раз.');
    } finally { setChecking(false); }
  };

  const continueStep = () => {
    setStepError('');
    if (step === 0 && (!car || carsLoading || carsError)) return setStepError('Оберіть авто зі завантаженого каталогу.');
    if (step === 1 && (!quoteMatches || checking)) return setStepError('Перевірте доступність і отримайте попередній розрахунок перед продовженням.');
    if (step === 2 && !contactValid) return setStepError('Перевірте ім’я, телефон, email і підтвердіть ознайомлення з інформацією про дані.');
    if (step < 2) setStep((current) => current + 1);
  };

  const submitBooking = async () => {
    if (submitting) return;
    if (!quoteMatches) { setStepError('Спочатку перевірте доступність і вартість періоду.'); return; }
    if (!contactValid) {
      setContactAttempted(true);
      setStepError('Виправте поля, позначені нижче.');
      const firstInvalid = name.trim().length < 2 ? 'booking-name'
        : !phoneValid ? 'booking-phone'
          : !emailValid ? 'booking-email' : 'booking-privacy';
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setSubmitting(true); setBookingError(''); setStepError('');
    try {
      let key = sessionStorage.getItem('rentcar.booking-idempotency');
      if (!key) {
        key = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('rentcar.booking-idempotency', key);
      }
      const response = await fetch('/api/v1/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify({ ...requestData, fullName: name.trim(), phone: phone.trim(), email: email.trim() || null, privacyNoticeAccepted: privacyAcknowledged }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409 && String(data.detail || '').includes('Ключ повторної відправки')) sessionStorage.removeItem('rentcar.booking-idempotency');
      if (!response.ok) throw new Error(data.detail || 'Не вдалося надіслати заявку. Спробуйте ще раз.');
      if (!data.id || data.status !== 'pending') throw new Error('Сервер не підтвердив створення заявки.');
      sessionStorage.removeItem('rentcar.booking-idempotency');
      setBookingResult(data);
    } catch (error) {
      setBookingError(error.message || 'Сервер бронювання недоступний. Спробуйте пізніше.');
    } finally { setSubmitting(false); }
  };

  if (bookingResult) return <React.Fragment>
    <Navbar base="index.html" />
    <main className="bg-[#0a0a0a] text-white min-h-screen grid place-items-center px-4 pt-24 pb-20">
      <div className="max-w-[620px] text-center">
        <span className="w-16 h-16 rounded-full bg-gold text-black grid place-items-center mx-auto mb-8"><Icon name="check" size={30} /></span>
        <span className="kicker is-centered text-gold mb-5">Заявку отримано · очікує підтвердження</span>
        <h1 className="font-display uppercase text-[44px] md:text-[64px] leading-[0.9] mb-5">Це ще не підтверджене бронювання</h1>
        <p className="text-white/60 leading-relaxed">Номер {bookingResult.id}. {bookingResult.pickupLocationName}, {displayAt(bookingResult.startAtUtc, bookingResult.pickupTimeZone)} → {bookingResult.returnLocationName}, {displayAt(bookingResult.endAtUtc, bookingResult.returnTimeZone)}.</p>
        <p className="font-display text-2xl mt-5">Попередня сума: {fmtMoney(bookingResult.totalAmount)}</p>
        <p className="text-white/40 text-sm mt-4">Заявка збережена зі статусом очікування. Сповіщення оператора й канал відповіді не налаштовані; бронювання не підтверджене. Скасування/зміна через сайт недоступні, оплата не виконувалася.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><CTAButton variant="primary" href="index.html">На головну</CTAButton><CTAButton variant="ghost" arrow={false} href="Inventory.html">Каталог авто</CTAButton><CTAButton variant="ghost" arrow={false} href="admin.html">Панель оператора · демо</CTAButton></div>
      </div>
    </main>
    <Footer base="index.html" />
  </React.Fragment>;

  return <React.Fragment>
    <Navbar base="index.html" />
    <header className="bg-[#0a0a0a] text-white pt-32 md:pt-40 pb-12 md:pb-16">
      <div className="w-[90%] max-w-[1300px] mx-auto"><span className="kicker text-gold mb-5">Заявка на оренду</span><h1 className="font-display uppercase leading-[1.0] text-[46px] md:text-[72px] lg:text-[88px]">Оберіть авто та період</h1><p className="text-white/55 max-w-[600px] mt-6">Доступність перевіряє сервер для всього інтервалу. Надіслана заявка набуває статусу «очікує підтвердження».</p></div>
    </header>
    <main className="bg-[#0a0a0a] text-white pb-24 md:pb-32">
      <div className="w-[90%] max-w-[1300px] mx-auto grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start">
        <ol aria-label="Етапи заявки" className="lg:col-span-2 grid grid-cols-3 gap-2">{['Автомобіль', 'Період і пункти', 'Контакти'].map((label, index) => <li key={label}><button type="button" disabled={index > step} onClick={() => { setStep(index); setStepError(''); }} aria-current={index === step ? 'step' : undefined} className={'w-full min-h-11 text-left border-t-2 pt-3 text-xs sm:text-sm ' + (index === step ? 'border-gold text-white' : index < step ? 'border-gold/50 text-white/70' : 'border-white/15 text-white/35')}><span aria-hidden="true" className="font-display mr-2">0{index + 1}</span>{label}</button></li>)}</ol>
        <div className="min-w-0 space-y-10">
          {step === 0 && <section aria-labelledby="booking-car-heading"><h2 id="booking-car-heading" className="font-display uppercase text-2xl md:text-3xl mb-6">Автомобіль</h2>
            {carsLoading && <p role="status" className="text-white/55">Завантажуємо каталог…</p>}
            {carsError && <div><p role="alert" className="text-rose-300">{carsError}</p><button type="button" className="btn btn-ghost mt-3" onClick={() => setCarsRetry((value) => value + 1)}>Спробувати знову</button></div>}
            {!carsLoading && !carsError && cars.length === 0 && <p className="text-white/55">Каталог поки порожній.</p>}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{cars.map((item) => <button key={item.id} type="button" aria-pressed={selectedCar === item.id} onClick={() => { setSelectedCar(item.id); invalidateQuote(); }} className={'tile text-left p-4 flex gap-3 items-center ' + (selectedCar === item.id ? 'is-active' : '')}><div className="w-16 h-12 rounded overflow-hidden shrink-0 bg-neutral-800"><SmartImg src={IMG(item.img)} alt={item.make + ' ' + item.model} className="w-full h-full" imgClassName="object-cover w-full h-full" /></div><span><span className="block font-semibold text-sm">{item.make} {item.model}</span><span className="block text-white/45 text-xs mt-1">{fmtMoney(item.pricePerDay)} / добу</span></span></button>)}</div>
          </section>}

          {step === 1 && <section aria-labelledby="booking-period-heading" className="border-t border-white/10 pt-9"><h2 id="booking-period-heading" className="font-display uppercase text-2xl md:text-3xl mb-6">Період і пункти обслуговування</h2>
            {locationsLoading && <p role="status" className="text-white/55 mb-4">Завантажуємо налаштовані пункти…</p>}
            {locationsError && <div className="mb-4"><p role="alert" className="text-rose-300">{locationsError}</p><button type="button" className="btn btn-ghost mt-3" onClick={() => { setLocationsLoading(true); setLocationsRetry((value) => value + 1); }}>Спробувати завантажити знову</button></div>}
            {!locationsLoading && !locationsError && locations.length === 0 && <div className="border border-amber-300/25 bg-amber-300/5 p-5 mb-6"><p className="font-medium text-amber-100">Пункти видачі ще не налаштовані.</p><p className="text-sm text-white/55 mt-2">Компанія має додати реальні адреси, часові пояси та графік роботи в конфігурацію сервера. До цього заявку на оренду надіслати не можна.</p></div>}
            {locations.length > 0 && !eligibleLocations.length && <p className="text-amber-200/80 text-sm mb-6">Для цього автомобіля не налаштовано жодного пункту видачі/повернення.</p>}
            {eligibleLocations.length > 0 && <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <LocationSelect id="pickup-location" label="Де отримати автомобіль" value={pickupLocationId} error={pickupLocationError} onChange={(value) => { setPickupLocationId(value); invalidateQuote(); }} locations={eligibleLocations} />
              <LocationSelect id="return-location" label="Де повернути автомобіль" value={returnLocationId} error={returnLocationError} onChange={(value) => { setReturnLocationId(value); invalidateQuote(); }} locations={eligibleLocations} />
            </div>}
            {eligibleLocations.length > 0 && <div className="grid sm:grid-cols-2 gap-6">
              <DateTimeFields prefix="pickup" title="Отримання" date={startDate} time={startTime} dateError={pickupDateError} timeError={pickupTimeError} minDate={localDateForZone(pickupLocation?.timeZone)} zone={pickupLocation?.timeZone} onDate={(value) => { setStartDate(value); invalidateQuote(); }} onTime={(value) => { setStartTime(value); invalidateQuote(); }} />
              <DateTimeFields prefix="return" title="Повернення" date={endDate} time={endTime} dateError={returnDateError} timeError={returnTimeError} minDate={startDate || localDateForZone(returnLocation?.timeZone)} zone={returnLocation?.timeZone} onDate={(value) => { setEndDate(value); invalidateQuote(); }} onTime={(value) => { setEndTime(value); invalidateQuote(); }} />
            </div>}
            {pickupLocation && returnLocation && <p className="text-white/40 text-xs mt-4">Час вводиться за місцевим часом кожного пункту: отримання — {pickupLocation.timeZone}, повернення — {returnLocation.timeZone}. Сервер перетворює його на UTC і зберігає обидва часові пояси.</p>}
            {eligibleLocations.length > 0 && <div className="mt-6"><button type="button" disabled={checking || locationsLoading} onClick={checkPeriod} className="btn btn-primary">{checking ? 'Перевіряємо весь період…' : 'Перевірити доступність і вартість'}</button>{quoteError && <p role="alert" className="text-rose-300 text-sm mt-3">{quoteError}</p>}{quoteMatches && <p role="status" className="text-emerald-300 text-sm mt-3">Сервер перевірив увесь період. Перевірка повториться під час надсилання заявки.</p>}</div>}
          </section>}

          {step === 2 && <section aria-labelledby="booking-contact-heading" className="border-t border-white/10 pt-9"><h2 id="booking-contact-heading" className="font-display uppercase text-2xl md:text-3xl mb-6">Контактні дані</h2>
            <form id="booking-contact-form" noValidate onSubmit={(event) => { event.preventDefault(); submitBooking(); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/75 mb-2" htmlFor="booking-name">Ім’я та прізвище</label>
                  <input id="booking-name" autoComplete="name" required minLength="2" maxLength="100" className="field" placeholder="Наприклад, Олена Коваль" value={name} aria-invalid={!!nameError} aria-describedby={nameError ? 'booking-name-error' : undefined} onChange={(event) => setName(event.target.value)} />
                  {nameError && <p id="booking-name-error" role="alert" className="mt-2 text-sm text-rose-200">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-white/75 mb-2" htmlFor="booking-phone">Телефон</label>
                  <input id="booking-phone" autoComplete="tel" inputMode="tel" required maxLength="30" className="field" placeholder="+380…" type="tel" value={phone} aria-invalid={!!phoneError} aria-describedby={phoneError ? 'booking-phone-error' : undefined} onChange={(event) => setPhone(event.target.value)} />
                  {phoneError && <p id="booking-phone-error" role="alert" className="mt-2 text-sm text-rose-200">{phoneError}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/75 mb-2" htmlFor="booking-email">Email <span className="text-white/60">(необов’язково)</span></label>
                  <input id="booking-email" autoComplete="email" inputMode="email" maxLength="100" className="field" type="email" placeholder="name@example.com" value={email} aria-invalid={!!emailError} aria-describedby={emailError ? 'booking-email-error' : undefined} onChange={(event) => setEmail(event.target.value)} />
                  {emailError && <p id="booking-email-error" role="alert" className="mt-2 text-sm text-rose-200">{emailError}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="booking-privacy" className="flex min-h-11 items-start gap-3 py-2 text-sm text-white/75">
                    <input id="booking-privacy" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-gold" checked={privacyAcknowledged} aria-invalid={!!privacyError} aria-describedby={privacyError ? 'booking-privacy-error' : undefined} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} />
                    <span>Я ознайомився(-лася) з <a className="text-gold underline" href="privacy.html" target="_blank" rel="noreferrer">інформацією про обробку даних</a>.</span>
                  </label>
                  {privacyError && <p id="booking-privacy-error" role="alert" className="text-sm text-rose-200">{privacyError}</p>}
                </div>
              </div>
            </form>
          </section>}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24"><div className="card-elev rounded p-7">
          <div className="flex items-center gap-2.5 mb-6"><Pinwheel size={24} className="text-white" /><span className="font-display text-xl tracking-[0.06em]">RENTCAR</span></div>
          <p className="text-white/45 text-xs tracking-[0.2em] uppercase mb-5">Підсумок заявки</p>
          <div className="space-y-4 text-sm"><Row label="Авто" value={car ? `${car.make} ${car.model}` : '—'} /><Row label="Отримання" value={quoteMatches ? `${quote.pickupLocationName} · ${displayAt(quote.startAtUtc, quote.pickupTimeZone)}` : pickupLocation ? pickupLocation.name : '—'} /><Row label="Повернення" value={quoteMatches ? `${quote.returnLocationName} · ${displayAt(quote.endAtUtc, quote.returnTimeZone)}` : returnLocation ? returnLocation.name : '—'} /></div>
          {quoteMatches && <div className="border-t border-white/10 mt-6 pt-5 space-y-3">{quote.priceLines.map((line) => <Row key={line.code} label={`${line.label} (${fmtMoney(line.unitAmount)} × ${line.quantity})`} value={fmtMoney(line.amount)} />)}<Row label="Податки й інші збори" value="Не налаштовані" /><div className="flex items-baseline justify-between gap-3 pt-3 border-t border-white/10"><span className="text-white/50 text-sm">Попередньо</span><span className="font-display text-3xl tabular-nums">{fmtMoney(quote.totalAmount)}</span></div><p className="text-white/40 text-xs">Застава окремо: {fmtMoney(quote.depositAmount)}. Її порядок внесення не налаштований.</p><p className="text-white/40 text-xs">{quote.pricingNote}</p></div>}
          {step > 0 && <button type="button" onClick={() => { setStep((current) => current - 1); setStepError(''); }} className="btn btn-ghost w-full mt-5" style={{ width: '100%' }}>Назад</button>}
          {step < 2 ? <button type="button" onClick={continueStep} className="btn btn-primary w-full mt-3" style={{ width: '100%' }}>Далі</button> : <button type="submit" form="booking-contact-form" disabled={submitting || !quoteMatches} className="btn btn-primary w-full mt-3" style={{ width: '100%' }}>{submitting ? 'Надсилаємо заявку…' : 'Надіслати заявку'}</button>}
          {stepError && <p role="alert" className="text-amber-300 text-sm mt-3">{stepError}</p>}{bookingError && <div className="mt-3"><p role="alert" className="text-rose-300 text-sm">{bookingError}</p><button type="button" onClick={submitBooking} disabled={submitting} className="text-sm text-white/70 underline mt-2">Спробувати ще раз</button></div>}
          <p className="text-white/35 text-xs text-center mt-4">Заявка очікує підтвердження компанією. Правила скасування та зміни не надані.</p>
        </div></aside>
      </div>
    </main>
    <Footer base="index.html" />
    <div className="grain" aria-hidden="true" />
  </React.Fragment>;
}

function LocationSelect({ id, label, value, error, onChange, locations }) {
  const errorId = `${id}-error`;
  return <div><label className="block text-sm text-white/75 mb-2" htmlFor={id}>{label}</label><select id={id} required value={value} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} onChange={(event) => onChange(event.target.value)} className="field w-full"><option value="">Оберіть пункт</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.name} — {location.address}, {location.city} ({location.timeZone}; {formatWeekdays(location.weekdays)} {location.openingTime}–{location.closingTime})</option>)}</select>{error && <p id={errorId} role="alert" className="text-rose-200 text-sm mt-2">{error}</p>}</div>;
}

function formatWeekdays(days) {
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  return (days || []).map((day) => labels[day]).filter(Boolean).join(', ');
}

function DateTimeFields({ prefix, title, date, time, minDate, zone, dateError, timeError, onDate, onTime }) {
  const dateErrorId = `${prefix}-date-error`;
  const timeErrorId = `${prefix}-time-error`;
  return <fieldset className="min-w-0"><legend className="font-medium text-white mb-3">{title}</legend><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-white/65 mb-2" htmlFor={`${prefix}-date`}>Дата</label><input id={`${prefix}-date`} type="date" required min={minDate || undefined} value={date} aria-invalid={!!dateError} aria-describedby={dateError ? dateErrorId : undefined} onChange={(event) => onDate(event.target.value)} className="field w-full min-w-0" />{dateError && <p id={dateErrorId} role="alert" className="text-rose-200 text-sm mt-2">{dateError}</p>}</div><div><label className="block text-xs text-white/65 mb-2" htmlFor={`${prefix}-time`}>Місцевий час{zone ? ` · ${zone}` : ''}</label><input id={`${prefix}-time`} type="time" required value={time} aria-invalid={!!timeError} aria-describedby={timeError ? timeErrorId : undefined} onChange={(event) => onTime(event.target.value)} className="field w-full min-w-0" />{timeError && <p id={timeErrorId} role="alert" className="text-rose-200 text-sm mt-2">{timeError}</p>}</div></div></fieldset>;
}

function Row({ label, value }) {
  return <div className="flex items-baseline justify-between gap-4"><span className="text-white/45">{label}</span><span className="font-medium text-right">{value}</span></div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<BookingPage />);
