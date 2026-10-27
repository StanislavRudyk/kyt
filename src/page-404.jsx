/* ===== 404 — сторінка помилки (RentCar UA) ===== */

function NotFoundPage() {
  return (
    <React.Fragment>
      <Navbar base="index.html" />

      <section className="relative bg-[#0a0a0a] text-white min-h-screen grid place-items-center px-4 pt-28 pb-20 overflow-hidden">
        {/* oversized ghost numerals */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="ghost-word" style={{ opacity: 0.42 }}>404</span>
        </div>

        {/* readability veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

        <div className="relative max-w-[640px] text-center">
          <span className="kicker is-centered text-gold mb-6">Помилка 404</span>
          <h1 className="font-display uppercase leading-[0.92] text-[44px] sm:text-[60px] md:text-[76px] tracking-[0.01em] mb-6">
            Цього маршруту<br />не існує
          </h1>
          <p className="text-white/55 text-base md:text-lg leading-relaxed max-w-[440px] mx-auto mb-10" style={{ textWrap: 'balance' }}>
            Сторінка, яку ви шукаєте, була переміщена або ніколи не існувала. Повернімося на правильну дорогу.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAButton variant="primary" href="index.html">На головну</CTAButton>
            <CTAButton variant="ghost" arrow={false} href="Inventory.html">Каталог авто</CTAButton>
          </div>

          {/* quick links */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm">
            <span className="text-white/35">Швидкі посилання</span>
            <a href="Inventory.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Каталог</a>
            <a href="Financing.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Тарифи</a>
            <a href="Service.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Бронювання</a>
            <a href="contact.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Контакти</a>
            <a href="contract.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Умови</a>
            <a href="About.html" className="rule-grow text-white/70 hover:text-white transition-colors pb-0.5">Про нас</a>
          </div>
        </div>
      </section>

      <Footer base="index.html" />
      <div className="grain" aria-hidden="true" />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NotFoundPage />);
