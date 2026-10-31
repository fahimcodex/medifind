export function BrandPanel() {
  return (
    <aside className="flex min-h-[360px] flex-1 flex-col justify-between bg-primary-600 px-8 py-8 text-white sm:px-12 lg:min-h-screen lg:px-20 lg:py-16">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-white text-xl font-semibold text-primary-600">+</span>
        <span className="text-[21px] font-bold tracking-[-0.03em]">MediFind</span>
      </div>
      <div className="max-w-[460px] pt-16 lg:pb-10">
        <h1 className="text-4xl font-bold leading-[1.12] tracking-[-0.04em] sm:text-5xl">
          Know before you go.
        </h1>
        <p className="mt-5 max-w-[430px] text-base leading-7 text-primary-50">
          Check real-time medicine availability at pharmacies near you, and reserve your order before you leave home.
        </p>
      </div>
    </aside>
  );
}
