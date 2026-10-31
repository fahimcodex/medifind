const steps = [
  { number: "01", title: "Search your medicine", text: "Enter a brand or generic medicine name to get started." },
  { number: "02", title: "Compare pharmacies", text: "See availability, distance, and useful details side by side." },
  { number: "03", title: "Reserve for pickup", text: "Choose a pharmacy and reserve your medicine before you arrive." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8 lg:py-[104px]">
      <div className="max-w-[530px]"><p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-600">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Medicine, made easier.</h2><p className="mt-4 text-base leading-7 text-ink-600">Spend less time calling around and more time getting the care you need.</p></div>
      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
        {steps.map((step) => <div key={step.number} className="border-t-2 border-primary-600 pt-5"><span className="text-sm font-bold text-primary-600">{step.number}</span><h3 className="mt-6 text-xl font-bold tracking-[-0.02em]">{step.title}</h3><p className="mt-3 text-[15px] leading-6 text-ink-600">{step.text}</p></div>)}
      </div>
    </section>
  );
}
