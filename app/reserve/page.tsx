import { Footer } from "@/components/landing/Footer";
import { ReserveForm } from "@/components/reserve/ReserveForm";
import { Navbar } from "@/components/landing/Navbar";
import { getTotalQuantity, type StockBatch } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type ReservePageProps = {
  searchParams: Promise<{ pharmacy?: string; medicine?: string }>;
};

type Medicine = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
  form: string | null;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
};

export default async function ReservePage({ searchParams }: ReservePageProps) {
  const { pharmacy: pharmacyId, medicine: medicineId } = await searchParams;
  if (!pharmacyId || !medicineId) notFound();

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) throw new Error("Unable to load account details.", { cause: profileError });

  if (profile?.role !== "patient") {
    return (
      <div className="min-h-screen bg-surface font-sans text-ink-900">
        <Navbar />
        <main className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:px-20">
          <div className="rounded-2xl border border-line bg-background p-8 text-center">
            <p className="font-semibold">Only patient accounts can reserve</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const [
    { data: medicineData, error: medicineError },
    { data: pharmacyData, error: pharmacyError },
    { data: inventoryData, error: inventoryError },
    { data: reservationsData, error: reservationsError },
  ] = await Promise.all([
    supabase.from("medicines").select("id, brand_name, generic_name, strength, form").eq("id", medicineId).maybeSingle(),
    supabase.from("pharmacies").select("id, name, address, phone, opening_hours").eq("id", pharmacyId).maybeSingle(),
    supabase.from("inventory").select("quantity, low_stock_threshold, expiry_date").eq("pharmacy_id", pharmacyId).eq("medicine_id", medicineId),
    supabase.from("reservations").select("quantity").eq("pharmacy_id", pharmacyId).eq("medicine_id", medicineId).in("status", ["pending", "confirmed"]).gt("expires_at", new Date().toISOString()),
  ]);
  if (medicineError || pharmacyError || inventoryError || reservationsError) {
    throw new Error("Unable to load reservation details.", { cause: medicineError ?? pharmacyError ?? inventoryError ?? reservationsError });
  }

  const medicine = medicineData as Medicine | null;
  const pharmacy = pharmacyData as Pharmacy | null;
  if (!medicine || !pharmacy) notFound();

  const stock = getTotalQuantity((inventoryData ?? []) as StockBatch[]);
  const held = (reservationsData ?? []).reduce((total, reservation) => total + reservation.quantity, 0);
  const availableQuantity = Math.max(0, stock - held);
  const medicineLabel = `${medicine.brand_name}${medicine.strength ? ` ${medicine.strength}` : ""}`;

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-20">
        <div className="flex items-center gap-2 text-[13px]">
          <Link href="/search" className="font-semibold text-primary-600">Search results</Link>
          <span className="text-ink-400">›</span>
          <Link href={`/medicines/${medicine.id}`} className="font-semibold text-primary-600">{medicineLabel}</Link>
          <span className="text-ink-400">›</span>
          <span className="font-medium text-ink-600">Reserve</span>
        </div>
        <div className="mt-5">
          <h1 className="text-[28px] font-bold tracking-[-0.035em]">Reserve for pickup</h1>
          <p className="mt-1 text-sm text-ink-600">Review the details below, then send your reservation to the pharmacy.</p>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-[14px] border border-line bg-background p-6">
              <h2 className="text-base font-bold">Medicine</h2>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary-50 text-[22px] font-bold text-primary-600">+</div>
                  <div><p className="text-lg font-semibold">{medicineLabel}</p><p className="text-[13px] text-ink-600">{medicine.generic_name} · {medicine.form ?? "Medicine"}</p></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${availableQuantity > 0 ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"}`}>{availableQuantity > 0 ? "In stock" : "Unavailable"}</span>
              </div>
            </section>
            <section className="rounded-[14px] border border-line bg-background p-6">
              <h2 className="text-base font-bold">Pickup pharmacy</h2>
              <div className="mt-3"><p className="font-semibold">{pharmacy.name}</p><p className="mt-1 text-[13px] text-ink-600">{pharmacy.address ?? "Address unavailable"} · {pharmacy.opening_hours ?? "Hours unavailable"}</p>{pharmacy.phone ? <p className="text-[13px] text-ink-600">{pharmacy.phone}</p> : null}</div>
            </section>
            <ReserveForm pharmacyId={pharmacy.id} medicineId={medicine.id} availableQuantity={availableQuantity} />
          </div>
          <aside className="rounded-[14px] border border-line bg-background p-6">
            <h2 className="text-base font-bold">Reservation summary</h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4"><span className="text-ink-600">Medicine</span><strong>{medicineLabel}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-ink-600">Pharmacy</span><strong>{pharmacy.name}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-ink-600">Held for</span><strong>24 hours</strong></div>
            </div>
            <hr className="my-4 border-line" />
            <h3 className="text-sm font-bold">What happens next</h3>
            <ol className="mt-4 space-y-4 text-[13px] text-ink-600"><li>1. The pharmacy reviews your request.</li><li>2. You get a confirmation in My Reservations.</li><li>3. Pick up within 24 hours, or it expires.</li></ol>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
