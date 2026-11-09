import Link from "next/link";

type FilterOption = {
  label: string;
  count: number;
};

type FilterSidebarProps = {
  query: string;
  formOptions: FilterOption[];
  categoryOptions: FilterOption[];
  selectedForm?: string;
  selectedCategory?: string;
};

function FilterGroup({
  label,
  options,
  query,
  selected,
  filterKey,
  selectedCategory,
  selectedForm,
}: {
  label: string;
  options: FilterOption[];
  query: string;
  selected?: string;
  filterKey: "form" | "category";
  selectedCategory?: string;
  selectedForm?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-[13px] font-semibold text-ink-900">{label}</legend>
      {options.map((option) => {
        const params = new URLSearchParams({ q: query });
        if (filterKey === "form" && selectedCategory) params.set("category", selectedCategory);
        if (filterKey === "category" && selectedForm) params.set("form", selectedForm);
        if (selected !== option.label) params.set(filterKey, option.label);

        return (
          <Link
            key={option.label}
            href={`/search?${params.toString()}`}
            className="flex items-center justify-between gap-3 text-[13px] text-ink-600"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={`flex size-4 items-center justify-center rounded border text-[10px] font-bold ${selected === option.label ? "border-primary-600 bg-primary-600 text-background" : "border-line bg-background"}`}>
                {selected === option.label ? "✓" : null}
              </span>
              <span className="truncate">{option.label}</span>
            </span>
            <span className="text-xs text-ink-400">{option.count}</span>
          </Link>
        );
      })}
    </fieldset>
  );
}

export function FilterSidebar({
  query,
  formOptions,
  categoryOptions,
  selectedForm,
  selectedCategory,
}: FilterSidebarProps) {
  const clearParams = new URLSearchParams({ q: query });

  return (
    <aside className="w-full shrink-0 rounded-[14px] border border-line bg-background p-5 lg:w-[240px]" aria-label="Search filters">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-900">Filters</h2>
        <Link href={`/search?${clearParams.toString()}`} className="text-[13px] font-semibold text-primary-600 hover:text-primary-700">
          Clear
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <FilterGroup
          label="Dosage form"
          options={formOptions}
          query={query}
          selected={selectedForm}
          selectedCategory={selectedCategory}
          selectedForm={selectedForm}
          filterKey="form"
        />
        <FilterGroup
          label="Category"
          options={categoryOptions}
          query={query}
          selected={selectedCategory}
          selectedCategory={selectedCategory}
          selectedForm={selectedForm}
          filterKey="category"
        />
      </div>
    </aside>
  );
}
