import { PharmacyResults, type PharmacyResult } from "@/components/medicines/PharmacyResults";
import { PharmacyMap } from "@/components/map/PharmacyMap";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { getStockStatus, type StockBatch } from "@/lib/stock";
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

function activeQuantity(batches: StockBatch[]) {
  const today = new Date().toISOString().slice(0, 10);

  return batches
    .filter((batch) => !batch.expiry_date || batch.expiry_date >= today)
    .reduce((total, batch) => total + batch.quantity, 0);
}

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
        .select("*, pharmacies(*)")
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
      quantity: activeQuantity(batches),
    }),
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-12 lg:px-8">
        <Link href="/search" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          ← Back to search
        </Link>

        <section className="mt-8 rounded-2xl border border-line bg-background p-6 sm:p-8">
          <p className="text-sm font-semibold text-primary-600">{medicine.category ?? "Medicine"}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{medicine.brand_name}</h1>
          <p className="mt-2 text-lg text-ink-600">{medicine.generic_name}</p>
          <dl className="mt-6 grid max-w-md grid-cols-2 gap-5 border-t border-line pt-5 text-sm">
            <div>
              <dt className="text-ink-400">Strength</dt>
              <dd className="mt-1 font-semibold">{medicine.strength ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Form</dt>
              <dd className="mt-1 font-semibold">{medicine.form ?? "—"}</dd>
            </div>
          </dl>
          {medicine.description ? <p className="mt-6 max-w-2xl text-ink-600">{medicine.description}</p> : null}
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-start">
          <PharmacyResults pharmacies={pharmacies} />
          <aside className="lg:sticky lg:top-6" aria-label="Pharmacy map">
            <PharmacyMap pharmacies={pharmacies} />
          </aside>
        </div>

        {(alternativesData ?? []).length > 0 ? (
          <section className="mt-14" aria-labelledby="alternatives-heading">
            <h2 id="alternatives-heading" className="text-2xl font-bold tracking-[-0.03em]">
              Alternative brands
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(alternativesData as Medicine[]).map((alternative) => (
                <Link
                  key={alternative.id}
                  href={`/medicines/${alternative.id}`}
                  className="rounded-2xl border border-line bg-background p-6 transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-primary-600">{alternative.category ?? "Medicine"}</p>
                  <h3 className="mt-3 text-xl font-bold">{alternative.brand_name}</h3>
                  <p className="mt-1 text-ink-600">{alternative.generic_name}</p>
                  <p className="mt-4 text-sm text-ink-600">
                    {alternative.strength ?? "—"} · {alternative.form ?? "—"}
                  </p>
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
