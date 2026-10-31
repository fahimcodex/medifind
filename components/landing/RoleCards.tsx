function ArrowIcon() {
  return <span aria-hidden="true" className="text-xl">→</span>;
}

export function RoleCards() {
  return (
    <section id="pharmacies" className="bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-5 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-[104px]">
        <article className="rounded-2xl bg-primary-600 p-8 text-white sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-50">For patients</p><h2 className="mt-5 max-w-sm text-3xl font-bold leading-tight tracking-[-0.035em]">Find your medicine with confidence.</h2><p className="mt-4 max-w-md leading-7 text-primary-50">Get clear, up-to-date information about local availability so you can make your next visit easier.</p><a href="#find-medicine" className="mt-8 inline-flex items-center gap-3 font-semibold text-white">Find a medicine <ArrowIcon /></a></article>
        <article id="for-pharmacies" className="rounded-2xl border border-line bg-white p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-600">For pharmacies</p><h2 className="mt-5 max-w-sm text-3xl font-bold leading-tight tracking-[-0.035em]">Help more people find you.</h2><p className="mt-4 max-w-md leading-7 text-ink-600">Keep your stock visible, reach nearby patients, and make medicine pickup simple for everyone.</p><a href="#contact" className="mt-8 inline-flex items-center gap-3 font-semibold text-primary-600">List your pharmacy <ArrowIcon /></a></article>
      </div>
    </section>
  );
}
