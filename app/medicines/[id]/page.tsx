import { PharmacyAvailability } from "@/components/medicines/PharmacyAvailability";
import type { PharmacyResult } from "@/components/medicine/PharmacyResults";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { getStockStatus, getTotalQuantity, type StockBatch } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Medicine = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
  form: string | null;
  category: string | null;
  description: string | null;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
};

type InventoryRow = StockBatch & {
  pharmacy_id: string;
  pharmacies: Pharmacy | Pharmacy[] | null;
};

type MedicinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function MedicinePage({ params }: MedicinePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: medicineData, error: medicineError } = await supabase
    .from("medicines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (medicineError) {
    throw new Error("Unable to load medicine.", { cause: medicineError });
  }

  const medicine = medicineData as Medicine | null;
  if (!medicine) {
    notFound();
  }

  let alternativesQuery = supabase
    .from("medicines")
    .select("id, brand_name, generic_name, strength, form, category")
    .eq("generic_name", medicine.generic_name)
    .neq("id", medicine.id)
    .order("brand_name");

  alternativesQuery =
    medicine.strength === null
      ? alternativesQuery.is("strength", null)
      : alternativesQuery.eq("strength", medicine.strength);
  alternativesQuery =
    medicine.form === null
      ? alternativesQuery.is("form", null)
      : alternativesQuery.eq("form", medicine.form);

  const [{ data: inventoryData, error: inventoryError }, { data: alternativesData, error: alternativesError }] =
    await Promise.all([
      supabase
        .from("inventory")
        .select("*, pharmacies!inner(*)")
        .eq("pharmacies.status", "approved")
        .eq("medicine_id", medicine.id),
      alternativesQuery,
    ]);

  if (inventoryError) {
    throw new Error("Unable to load pharmacy availability.", { cause: inventoryError });
  }
  if (alternativesError) {
    throw new Error("Unable to load alternative medicines.", { cause: alternativesError });
  }

  const groupedPharmacies = new Map<string, { pharmacy: Pharmacy; batches: StockBatch[] }>();
  for (const row of (inventoryData ?? []) as InventoryRow[]) {
    const pharmacy = Array.isArray(row.pharmacies) ? row.pharmacies[0] : row.pharmacies;
    if (!pharmacy) {
      throw new Error("Inventory record is missing its pharmacy.");
    }

    const existing = groupedPharmacies.get(row.pharmacy_id);
    if (existing) {
      existing.batches.push(row);
    } else {
      groupedPharmacies.set(row.pharmacy_id, { pharmacy, batches: [row] });
    }
  }

  const pharmacies: PharmacyResult[] = Array.from(groupedPharmacies.values()).map(
    ({ pharmacy, batches }) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      openingHours: pharmacy.opening_hours,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      status: getStockStatus(batches),
      quantity: getTotalQuantity(batches),
    }),
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-20">
        <div className="flex items-center gap-2 text-[13px]">
          <Link href="/search" className="font-semibold text-primary-600 hover:text-primary-700">
            Search results
          </Link>
          <span className="text-ink-400">›</span>
          <span className="font-medium text-ink-600">
            {medicine.brand_name} {medicine.strength ?? ""}
          </span>
        </div>

        <section className="mt-5 flex flex-col justify-between gap-6 rounded-2xl border border-line bg-background p-7 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[30px] font-bold tracking-[-0.035em]">{medicine.brand_name}</h1>
              {medicine.strength ? (
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-600">
                  {medicine.strength}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-base font-medium text-ink-600">Generic: {medicine.generic_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {medicine.form ? (
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600">
                  {medicine.form}
                </span>
              ) : null}
              {medicine.category ? (
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-600">
                  {medicine.category}
                </span>
              ) : null}
            </div>
            {medicine.description ? <p className="mt-2 text-sm text-ink-600">{medicine.description}</p> : null}
          </div>
        </section>

        <div className="mt-4 rounded-[10px] bg-warning-50 px-4 py-3 text-[13px] font-medium text-warning-600">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-warning-600 font-bold text-white">!</span>
          Availability may be outdated. Please confirm with the pharmacy before traveling or picking up.
        </div>

        <PharmacyAvailability pharmacies={pharmacies} medicineId={medicine.id} />

        {(alternativesData ?? []).length > 0 ? (
          <section className="mt-14" aria-labelledby="alternatives-heading">
            <h2 id="alternatives-heading" className="text-2xl font-bold tracking-[-0.03em]">
              Alternative brands
            </h2>
            <p className="mt-2 text-sm text-ink-600">
              Same generic ({medicine.generic_name}), strength ({medicine.strength ?? "—"}) and form ({medicine.form ?? "—"}). Information only, not a recommendation.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(alternativesData as Medicine[]).map((alternative) => (
                <Link
                  key={alternative.id}
                  href={`/medicines/${alternative.id}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-background px-4 py-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{alternative.brand_name}</h3>
                    <p className="mt-1 text-xs text-ink-600">
                      {alternative.generic_name} {alternative.strength ?? "—"} · {alternative.form ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-600">View availability →</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-12 text-center text-sm text-ink-600">
          Availability may be outdated. Confirm with the pharmacy before visiting.
        </p>
      </main>
      <Footer />
    </div>
  );
}
