import { ReservationList, type ReservationItem } from "@/components/reservations/ReservationList";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Closed" },
] as const;

type ReservationsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

type ReservationRow = Omit<ReservationItem, "medicine" | "pharmacy"> & {
  medicines: ReservationItem["medicine"] | ReservationItem["medicine"][] | null;
  pharmacies: ReservationItem["pharmacy"] | ReservationItem["pharmacy"][] | null;
};

function getJoinedValue<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const { status: requestedStatus } = await searchParams;
  const activeTab = tabs.some((tab) => tab.key === requestedStatus) ? requestedStatus ?? "all" : "all";
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { error: expiryError } = await supabase.rpc("expire_reservations");
  if (expiryError) {
    throw new Error("Unable to update reservation statuses.", { cause: expiryError });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("id, quantity, status, created_at, expires_at, medicines!inner(id, brand_name, strength), pharmacies!inner(id, name, address, latitude, longitude)")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load reservations.", { cause: error });
  }

  const reservations = ((data ?? []) as ReservationRow[]).map((row) => {
    const medicine = getJoinedValue(row.medicines);
    const pharmacy = getJoinedValue(row.pharmacies);
    if (!medicine || !pharmacy) {
      throw new Error("Reservation record is missing its medicine or pharmacy.");
    }
    return { ...row, medicine, pharmacy };
  });

  const counts = {
    all: reservations.length,
    pending: reservations.filter((reservation) => reservation.status === "pending").length,
    confirmed: reservations.filter((reservation) => reservation.status === "confirmed").length,
    completed: reservations.filter((reservation) => reservation.status === "completed").length,
    closed: reservations.filter((reservation) => ["rejected", "cancelled", "expired"].includes(reservation.status)).length,
  };
  const filteredReservations = activeTab === "all"
    ? reservations
    : activeTab === "closed"
      ? reservations.filter((reservation) => ["rejected", "cancelled", "expired"].includes(reservation.status))
      : reservations.filter((reservation) => reservation.status === activeTab);

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-20">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.035em]">My reservations</h1>
          <p className="mt-1 text-sm text-ink-600">Track your pickup requests and see their current status.</p>
        </div>
        <div className="mt-4 rounded-[10px] bg-primary-50 px-4 py-3 text-[13px] font-medium text-primary-600">
          Reservations are held for 24 hours. Expired reservations are closed automatically.
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Reservation status">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link key={tab.key} href={tab.key === "all" ? "/reservations" : `/reservations?status=${tab.key}`} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${isActive ? "bg-primary-600 text-white" : "border border-line bg-background text-ink-600 hover:bg-primary-50 hover:text-primary-600"}`}>
                {tab.label} <span className={isActive ? "text-primary-50" : "text-ink-400"}>{counts[tab.key]}</span>
              </Link>
            );
          })}
        </nav>
        <section className="mt-5" aria-label="Reservations">
          <ReservationList reservations={filteredReservations} />
        </section>
      </main>
      <footer className="mt-8 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-6 py-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between lg:px-20">
          <span>© 2026 MediFind</span>
          <span>Information &amp; reservation support only — not a substitute for professional medical advice.</span>
        </div>
      </footer>
    </div>
  );
}
