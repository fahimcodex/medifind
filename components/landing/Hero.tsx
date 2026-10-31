function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M19 10.1c0 4.7-7 10.2-7 10.2s-7-5.5-7-10.2a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="find-medicine" className="overflow-hidden border-b border-line bg-primary-50">
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-[88px] text-center lg:px-8 lg:pb-[112px] lg:pt-[88px]">
        <span className="inline-flex rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-600 shadow-sm">Trusted medicine availability, near you</span>
        <h1 className="mx-auto mt-7 max-w-[760px] text-4xl font-bold leading-[1.12] tracking-[-0.045em] text-ink-900 sm:text-5xl lg:text-[56px]">Find the medicine you need at a pharmacy near you</h1>
        <p className="mx-auto mt-6 max-w-[630px] text-base leading-7 text-ink-600 sm:text-lg">Search by brand or generic name, compare nearby pharmacies by stock and distance, and reserve your medicine for pickup — all in one place.</p>
        <form className="mx-auto mt-10 grid max-w-[780px] gap-3 rounded-2xl bg-white p-3 text-left shadow-lg sm:grid-cols-[1fr_0.85fr_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm text-ink-400 focus-within:border-primary-600">
            <SearchIcon />
            <input className="min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400" placeholder="Search a medicine" />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm text-ink-400 focus-within:border-primary-600">
            <LocationIcon />
            <input className="min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400" placeholder="Your location" />
          </label>
          <button type="submit" className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700">Search</button>
        </form>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-600"><span className="size-2 rounded-full bg-success-600" /><span>Helping you find what you need, when you need it</span></div>
      </div>
    </section>
  );
}
