/* ===== Навігація (RentCar UA) ===== */
const NAV_LINKS = ['Каталог', 'Тарифи', 'Бронювання', 'Контакти', 'Договір', 'Про нас'];

function navHref(l, base) {
  if (l === 'Каталог') return 'Inventory.html';
  if (l === 'Бронювання') return 'Service.html';
  if (l === 'Тарифи') return 'Financing.html';
  if (l === 'Контакти') return 'contact.html';
  if (l === 'Договір') return 'contract.html';
  if (l === 'Про нас') return 'About.html';
  return base + '#' + l.toLowerCase();
}

function handleAnchorClick(e, href) {
  if (!href || href.indexOf('#') === -1) return;
  const hashIdx = href.indexOf('#');
  const pagePart = href.slice(0, hashIdx);
  const id = href.slice(hashIdx + 1);
  if (pagePart && pagePart !== window.location.pathname.split('/').pop()) return;
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', '#' + id);
}

function Navbar({ base = '' }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const menuRef = useRef(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      if (wasMenuOpenRef.current) menuButtonRef.current?.focus();
      wasMenuOpenRef.current = false;
      return;
    }
    wasMenuOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
      if (event.key === 'Tab' && menuRef.current) {
        const items = Array.from(menuRef.current.querySelectorAll('a[href], button:not(:disabled)'));
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <React.Fragment>
      <nav
        aria-label="Головна навігація"
        className={
          'nav-enter fixed top-0 inset-x-0 z-30 px-2.5 sm:px-4 md:px-10 flex items-center justify-between ' +
          'transition-all duration-500 ' +
          (scrolled
            ? 'py-2 bg-black/90 backdrop-blur-[80px] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            : 'py-4 bg-transparent')
        }
      >
        {/* Ліво — логотип */}
        <a href={base ? base : '#top'} aria-label="RentCar — на початок сторінки" className="logo-link flex items-center gap-2 sm:gap-2.5 text-white shrink-0">
          <Pinwheel size={scrolled ? 24 : 30} className="logo-mark mark-enter transition-all duration-500" />
          <span
            className={
              'font-display tracking-[0.06em] leading-none transition-all duration-500 ' +
              (scrolled ? 'text-2xl' : 'text-2xl sm:text-3xl')
            }
          >
            RENTCAR
          </span>
        </a>

        {/* Центр — посилання */}
        <div className="hidden xl:flex items-center gap-5 2xl:gap-9">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={navHref(l, base)}
              onClick={(e) => handleAnchorClick(e, navHref(l, base))}
              className="rule-grow inline-flex min-h-11 items-center px-1 text-sm font-medium text-[#EEEFF2] hover:text-white transition-colors duration-300 pb-0.5"
            >
              {l}
            </a>
          ))}
        </div>

        {/* Право — дії */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 shrink-0">
          <a
            href="Inventory.html"
            className="btn btn-primary gap-1.5 px-2 sm:gap-2 sm:px-4 text-[12px] sm:text-[13px]"
            style={{ height: '44px' }}
          >
            <Icon name="calendar" size={17} stroke={2} />
            <span className="hidden sm:inline">Знайти авто</span>
            <span className="sm:hidden">Каталог</span>
          </a>
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen(true)}
            className="icon-btn xl:hidden text-white w-11 h-11"
            aria-label="Відкрити меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </nav>

      {/* Мобільне меню */}
      <div
        ref={menuRef}
        id="mobile-navigation"
        role="dialog"
        aria-label="Мобільна навігація"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        className={
          'fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col transition-all duration-500 xl:hidden ' +
          (menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pinwheel size={26} className="text-white" />
            <span className="font-display text-2xl tracking-[0.06em] text-white">RENTCAR</span>
          </div>
          <button ref={closeButtonRef} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className="icon-btn text-white w-11 h-11" aria-label="Закрити меню">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 gap-1">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l}
              href={navHref(l, base)}
              tabIndex={menuOpen ? 0 : -1}
              onClick={(e) => { setMenuOpen(false); handleAnchorClick(e, navHref(l, base)); }}
              className="font-display text-5xl tracking-wide text-white/90 hover:text-gold hover:pl-3 transition-all duration-300 py-3 border-b border-white/10"
              style={{ animation: menuOpen ? `fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) ${i * 60 + 120}ms both` : 'none' }}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="px-6 pb-10">
          <CTAButton tabIndex={menuOpen ? 0 : -1} variant="primary" href="Inventory.html" className="w-full" style={{ width: '100%' }}>Знайти авто</CTAButton>
        </div>
      </div>
    </React.Fragment>
  );
}

window.Navbar = Navbar;
