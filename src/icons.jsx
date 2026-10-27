/* ===== RentCar UA — shared utilities (icons, split-text, smart image) ===== */

/* Dismiss the static preloader the moment the app mounts (safety timeout as fallback) */
(function () {
  const pl = document.getElementById('preloader');
  if (!pl) return;
  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    pl.classList.add('pl-hide');
    if (root) root.classList.add('ready');
    setTimeout(function () { pl.remove(); }, 750);
  };
  const root = document.getElementById('root');
  const check = function () { if (root && root.children.length) { hide(); return true; } return false; };
  if (!check() && root) {
    const obs = new MutationObserver(function () {
      if (root.children.length) { obs.disconnect(); hide(); }
    });
    obs.observe(root, { childList: true });
  }
  window.addEventListener('load', function () { setTimeout(check, 100); });
  setTimeout(hide, 5000);
})();

/* Smooth cross-page navigation: fade the viewport to black before loading the
   next page (whose black preloader picks up seamlessly). Same-page hash links,
   external links, new-tab and modified clicks are left untouched. */
(function () {
  let leaving = false;
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (!url.pathname.endsWith('.html')) return;
    if (url.pathname === location.pathname) return; // same document (hash/scroll) — leave it
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    let ov = document.getElementById('page-exit');
    if (!ov) { ov = document.createElement('div'); ov.id = 'page-exit'; document.body.appendChild(ov); }
    setTimeout(function () { ov.classList.add('on'); }, 10);
    setTimeout(function () { location.href = a.href; }, 430);
  });
  // Clear the exit overlay when the page is restored from bfcache (browser back/forward)
  // or shown again — otherwise the user lands on a black screen.
  function clearExitOverlay() {
    leaving = false;
    const ov = document.getElementById('page-exit');
    if (ov) ov.remove();
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) clearExitOverlay(); });
  window.addEventListener('popstate', clearExitOverlay);
})();

/* Magnetic CTAs — primary action buttons gently lean toward the cursor.
   Pointer devices only; disabled for touch and reduced-motion. */
(function () {
  if (!window.matchMedia) return;
  if (matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const STRENGTH = 0.22;
  function attach(el) {
    el.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
      const my = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
      el.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px)';
    });
    el.addEventListener('mouseleave', function () { el.style.transform = ''; });
  }
  function scan() {
    document.querySelectorAll('[data-magnetic]:not([data-mag-on])').forEach(function (el) {
      el.setAttribute('data-mag-on', '1');
      attach(el);
    });
  }
  let t;
  const mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 120); });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  scan();
  window.addEventListener('load', scan);
})();

const { useState, useRef, useEffect, useLayoutEffect } = React;

/* lucide-style line icons (MIT path data) rendered inline */
const ICON_PATHS = Object.freeze({
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  xTwitter: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  battery: '<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/>',
  sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
});

function Icon({ name, size = 24, stroke = 2, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: Object.hasOwn(ICON_PATHS, name) ? ICON_PATHS[name] : '' }}
    />
  );
}

/* The RentCar monogram — a dynamic emblem that accelerates into a gold
   speed-streak, set inside a subtle seal ring. */
function Pinwheel({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.25" opacity="0.3" />
      <path d="M8 10 L15 22 L19.4 14.6" stroke="currentColor" strokeWidth="2.7"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.4 14.6 L24.4 6.5" stroke="var(--gold)" strokeWidth="2.7"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Splits text into animatable per-char spans (SplitText stand-in).
   Chars are grouped per word (inline-block) with real, breakable spaces
   between words, so headlines wrap by whole word on narrow screens
   instead of overflowing as one unbreakable run. */
function SplitChars({ text, className = '' }) {
  const words = text.split(' ');
  return (
    <React.Fragment>
      {words.map((word, wi) => (
        <React.Fragment key={wi}>
          <span className="split-word">
            {word.split('').map((ch, ci) => (
              <span key={ci} data-split-char className={'split-char ' + className}>{ch}</span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AVOID_BACKGROUND_VIDEO = PREFERS_REDUCED_MOTION ||
  (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  (typeof navigator !== 'undefined' && Boolean(navigator.connection && navigator.connection.saveData));

/* Runs the SplitText-style char reveal on the element's [data-split-char] children */
function useCharReveal(ref, deps = []) {
  useEffect(() => {
    if (!ref.current || !window.gsap || PREFERS_REDUCED_MOTION) return;
    const chars = ref.current.querySelectorAll('[data-split-char]');
    const ctx = gsap.context(() => {
      gsap.from(chars, {
        opacity: 0, y: 40, duration: 0.8, stagger: 0.03, ease: 'power3.out',
        scrollTrigger: ref.current.dataset.scroll
          ? { trigger: ref.current, start: 'top 85%', once: true }
          : undefined,
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line
  }, deps);
}

const PORTRAIT_IMAGE_SLUGS = new Set(['black-saloon', 'blacked-suv', 'crossover-floor', 'electric-sedan', 'performance-coupe', 'pickup-grey', 'silver-coupe-detail']);

/* Responsive image with a WebP source and a JPEG fallback. */
function SmartImg({ src, alt = '', label, className = '', imgClassName = '', kb, loading = 'lazy', fetchPriority, sizes = '(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw' }) {
  const [err, setErr] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.complete && ref.current.naturalWidth > 0) { setLoaded(true); return; }
    const t = setTimeout(() => setLoaded(true), 4000); // safety: never stay hidden
    return () => clearTimeout(t);
  }, []);
  if (err) {
    return (
      <div className={'img-fallback ' + className}>
        <span aria-hidden={!label && !alt}>{label || alt || 'image'}</span>
      </div>
    );
  }
  const imageMatch = src.match(/^assets\/images\/(.+)\.jpg$/);
  const imageWidths = imageMatch ? (PORTRAIT_IMAGE_SLUGS.has(imageMatch[1]) ? [480, 800, 896] : [480, 800, 1200]) : [];
  const webpSet = imageMatch ? imageWidths.map((width) => `assets/images/${imageMatch[1]}-${width}.webp ${width}w`).join(', ') : '';
  return (
    <picture className={'block ' + className}>
      {webpSet && <source type="image/webp" srcSet={webpSet} sizes={sizes} />}
      <img
        ref={ref}
        src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} sizes={sizes} decoding="async" draggable="false"
        className={'w-full h-full ' + imgClassName + ' media-grade img-smart' + (loaded ? ' is-loaded' : '') + (kb ? ' ' + kb : '')}
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
      />
    </picture>
  );
}

/* Premium CTA button with dual-arrow swap on hover — renders <a> when href is set */
function CTAButton({ children, variant = 'primary', arrow = true, href, className = '', ...props }) {
  const v = variant === 'ghost' ? 'btn-ghost' : variant === 'dark' ? 'btn-dark' : 'btn-primary';
  const cls = 'btn ' + v + ' ' + className;
  const inner = (
    <React.Fragment>
      <span>{children}</span>
      {arrow && (
        <span className="btn-arrows" aria-hidden="true">
          <Icon name="arrowRight" size={17} className="a-out" />
          <Icon name="arrowRight" size={17} className="a-in" />
        </span>
      )}
    </React.Fragment>
  );
  if (href) return <a href={href} className={cls} data-magnetic {...props}>{inner}</a>;
  return <button className={cls} data-magnetic {...props}>{inner}</button>;
}

/* Circular icon button — fills gold on hover */
function IconButton({ name, size = 18, label, className = '', as = 'button', href, ...props }) {
  const inner = <Icon name={name} size={size} />;
  if (as === 'a') {
    return (
      <a href={href} aria-label={label} className={'icon-btn ' + className} {...props}>{inner}</a>
    );
  }
  return (
    <button aria-label={label} className={'icon-btn ' + className} {...props}>{inner}</button>
  );
}

/* Number that counts up from 0 when it scrolls into view (IO-based, no GSAP ticker) */
function CountUp({ end, duration = 1700, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (PREFERS_REDUCED_MOTION) { setVal(end); return; }
    let raf, started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(end * eased);
        if (p < 1) raf = requestAnimationFrame(tick); else setVal(end);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [end]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span ref={ref} className={className}>{prefix}{display}{suffix}</span>;
}

/* Wraps children in a fade/slide reveal triggered by IntersectionObserver */
function Reveal({ children, className = '', variant = '', delay = 0, as = 'div', ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); } });
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} className={'reveal ' + variant + ' ' + className} style={{ transitionDelay: delay + 'ms' }} {...props}>
      {children}
    </Tag>
  );
}

Object.assign(window, { Icon, Pinwheel, SplitChars, useCharReveal, SmartImg, CTAButton, IconButton, CountUp, Reveal, PREFERS_REDUCED_MOTION });
