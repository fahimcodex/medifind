import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { MedicineCard } from "@/components/search/MedicineCard";
import { SearchBar } from "@/components/search/SearchBar";
import { getStockStatus, type StockBatch } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";

type Medicine = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
  form: string | null;
  category: string | null;
};

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type InventoryRow = StockBatch & {
  medicine_id: string;
  pharmacy_id: string;
  pharmacies: { id: string; status: string } | { id: string; status: string }[] | null;
};

function getParam(params: SearchPageProps["searchParams"] extends Promise<infer T> ? T : never, key: string) {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function getNameSearchFilter(query: string) {
  const safeQuery = query.replace(/[(),]/g, " ").replace(/\\/g, "\\\\");
  return `brand_name.ilike.%${safeQuery}%,generic_name.ilike.%${safeQuery}%`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = getParam(params, "q");
  const selectedForm = getParam(params, "form");
  const selectedCategory = getParam(params, "category");
  let medicines: Medicine[] = [];
  let formOptions: { label: string; count: number }[] = [];
  let categoryOptions: { label: string; count: number }[] = [];
  const availability = new Map<string, { pharmacyCount: number; stockCount: number }>();

  const supabase = await createClient();
  let medicineQuery = supabase
    .from("medicines")
    .select("id, brand_name, generic_name, strength, form, category")
    .order("brand_name");

  if (query) medicineQuery = medicineQuery.or(getNameSearchFilter(query));
  if (selectedForm) medicineQuery = medicineQuery.eq("form", selectedForm);
  if (selectedCategory) medicineQuery = medicineQuery.eq("category", selectedCategory);

  const { data, error } = await medicineQuery;
  if (error) throw new Error("Unable to search medicines.", { cause: error });
  medicines = (data ?? []) as Medicine[];

  let filterQuery = supabase.from("medicines").select("form, category");
  if (query) filterQuery = filterQuery.or(getNameSearchFilter(query));

  const { data: filterData, error: filterError } = await filterQuery;
  if (filterError) throw new Error("Unable to load search filters.", { cause: filterError });

  const formCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const medicine of filterData ?? []) {
    if (medicine.form) formCounts.set(medicine.form, (formCounts.get(medicine.form) ?? 0) + 1);
    if (medicine.category) categoryCounts.set(medicine.category, (categoryCounts.get(medicine.category) ?? 0) + 1);
  }
  formOptions = Array.from(formCounts, ([label, count]) => ({ label, count }));
  categoryOptions = Array.from(categoryCounts, ([label, count]) => ({ label, count }));

  if (medicines.length > 0) {
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .select("medicine_id, pharmacy_id, quantity, low_stock_threshold, expiry_date, pharmacies!inner(id, status)")
      .in("medicine_id", medicines.map((medicine) => medicine.id))
      .eq("pharmacies.status", "approved");
    if (inventoryError) throw new Error("Unable to load pharmacy availability.", { cause: inventoryError });

    const grouped = new Map<string, Map<string, StockBatch[]>>();
    for (const row of (inventoryData ?? []) as InventoryRow[]) {
      const pharmacy = Array.isArray(row.pharmacies) ? row.pharmacies[0] : row.pharmacies;
      if (!pharmacy) throw new Error("Inventory record is missing its pharmacy.");
      const pharmacies = grouped.get(row.medicine_id) ?? new Map<string, StockBatch[]>();
      pharmacies.set(row.pharmacy_id, [...(pharmacies.get(row.pharmacy_id) ?? []), row]);
      grouped.set(row.medicine_id, pharmacies);
    }

    for (const medicine of medicines) {
      const pharmacies = grouped.get(medicine.id) ?? new Map<string, StockBatch[]>();
      const statuses = Array.from(pharmacies.values(), (batches) => getStockStatus(batches));
      availability.set(medicine.id, {
        pharmacyCount: statuses.length,
        stockCount: statuses.filter((status) => status !== "out_of_stock").length,
      });
    }
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1360px] px-6 pb-16 pt-10 lg:px-20">
        <SearchBar initialQuery={query} />
        <div className="mt-6 flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold">Results for “{query || "your search"}”</h1>
          <p className="text-sm font-medium text-ink-600">{medicines.length} medicines found</p>
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-[10px] bg-warning-50 px-4 py-3 text-[13px] font-medium text-warning-600">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning-600 text-xs font-bold text-background">!</span>
          <span>Availability may be outdated. Please confirm with the pharmacy before traveling or picking up.</span>
        </div>
        <div className="mt-6 flex flex-col items-start gap-8 lg:flex-row">
          <FilterSidebar query={query} formOptions={formOptions} categoryOptions={categoryOptions} selectedForm={selectedForm} selectedCategory={selectedCategory} />
          <section className="flex min-w-0 flex-1 flex-col gap-4" aria-live="polite">
            {medicines.length > 0 ? medicines.map((medicine) => {
              const summary = availability.get(medicine.id) ?? { pharmacyCount: 0, stockCount: 0 };
              return (
                <MedicineCard
                  key={medicine.id}
                  id={medicine.id}
                  brandName={medicine.brand_name}
                  genericName={medicine.generic_name}
                  strength={medicine.strength}
                  form={medicine.form}
                  category={medicine.category}
                  {...summary}
                />
              );
            }) : (
              <div className="rounded-[14px] border border-line bg-background px-6 py-12 text-center">
                <h2 className="text-xl font-bold">No medicines found</h2>
                <p className="mt-2 text-ink-600">{query ? "Try searching with a different name or filter." : "Search by brand or generic name to find medicine information."}</p>
              </div>
            )}
            {medicines.length > 0 ? <p className="text-[13px] text-ink-400">Can&apos;t find your medicine? Try the generic name or check the spelling.</p> : null}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
