/* ===== Бренди в автопарку — marquee стрічка (RentCar UA) ===== */

const BRANDS = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Lexus', 'Tesla',
  'Volvo', 'Land Rover', 'Ford', 'Lamborghini', 'Toyota', 'Hyundai',
];

function Partners() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="bg-[#0a0a0a] py-11 md:py-14 border-y border-white/10 overflow-hidden">
      <div className="text-center mb-7 md:mb-9 px-4">
        <span className="kicker is-centered text-white/45">Бренди в автопарку</span>
      </div>

      <div
        className="marquee-mask flex items-center"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        }}
      >
        <div className="marquee-track items-center">
          {row.map((b, i) => (
            <span key={i} className="flex items-center gap-9 md:gap-12 pr-9 md:pr-12">
              <span className="font-display text-2xl md:text-[34px] leading-none tracking-[0.06em] uppercase text-white/35 hover:text-white transition-colors duration-300 whitespace-nowrap">
                {b}
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-gold/70 shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Partners = Partners;
