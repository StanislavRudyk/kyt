/* ===== Підвал сайту (RentCar UA) ===== */

const NAVIGATE = ['Каталог', 'Тарифи', 'Бронювання', 'Контакти', 'Договір', 'Історія', 'Про нас'];

function Footer({ base = '' }) {
  const fhref = (l) => (
    l === 'Каталог' ? 'Inventory.html' :
    l === 'Бронювання' ? 'Service.html' :
    l === 'Тарифи' ? 'Financing.html' :
    l === 'Контакти' ? 'contact.html' :
    l === 'Договір' ? 'contract.html' :
    l === 'Історія' ? 'history.html' :
    l === 'Про нас' ? 'About.html' :
    base + '#' + l.toLowerCase()
  );
  return (
    <footer id="contact" className="bg-white text-black">
      {/* верхня частина */}
      <div className="px-4 md:px-10 py-16 md:py-24">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
            {/* контакти */}
            <div>
              <div className="flex items-center gap-2.5 mb-7">
                <Pinwheel size={30} className="text-black" />
                <span className="font-display text-3xl tracking-[0.06em]">RENTCAR</span>
              </div>
              <span className="kicker text-black/40 mb-6">Контакти</span>
              <p className="text-black/55 max-w-sm leading-relaxed">Перевірені телефон та адреса підтримки ще не надані.</p>
            </div>

            {/* колонки посилань */}
            <div className="flex gap-12 sm:gap-16 md:gap-24">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-black/40 font-medium mb-5">Навігація</p>
                <ul className="space-y-3">
                  {NAVIGATE.map((l) => (
                    <li key={l}>
                      <a href={fhref(l)} className="text-sm font-medium hover:text-gold transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* пункти видачі */}
          <p className="mt-12 pt-6 border-t border-black/10 text-black/45 text-xs">Адреси пунктів видачі та зовнішні сторінки бренду не підключені.</p>
        </div>
      </div>

      {/* темний нижній бар */}
      <div className="bg-black text-white/40">
        <div className="max-w-[1300px] mx-auto px-4 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 RentCar UA. Всі права захищені.</p>
          <div className="flex items-center gap-6">
            <a href="privacy.html" className="rule-grow hover:text-white transition-colors pb-0.5">Інформація про дані</a>
            <a href="contract.html" className="rule-grow hover:text-white transition-colors pb-0.5">Умови оренди</a>
            <a href="#top" className="icon-btn text-white/55 w-10 h-10" aria-label="Нагору">
              <Icon name="arrowUp" size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
