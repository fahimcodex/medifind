import { LogoutButton } from "@/components/auth/LogoutButton";
import { StockModal } from "@/components/pharmacy/StockModal";
import { updateReservationStatusFromForm } from "@/app/actions/reservations";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type InventoryRow = {
  id: string;
  medicine_id: string;
  quantity: number;
  low_stock_threshold: number;
  batch_no: string | null;
  expiry_date: string | null;
  medicines: { brand_name: string; strength: string | null } | { brand_name: string; strength: string | null }[] | null;
};

type MedicineOption = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
};

type ReservationRow = {
  id: string;
  quantity: number;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  medicines: { brand_name: string; strength: string | null } | { brand_name: string; strength: string | null }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string | null;
};

function joinedValue<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatTimeLeft(expiresAt: string, now: number) {
  const hours = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 3_600_000));
  return `${hours}h`;
}

function formatExpiry(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isExpiringSoon(date: string | null, today: string, thirtyDaysFromNow: string) {
  return Boolean(date && date >= today && date <= thirtyDaysFromNow);
}

export default async function PharmacyDashboardPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { error: expiryError } = await supabase.rpc("expire_reservations");
  if (expiryError) {
    throw new Error("Unable to update reservation statuses.", { cause: expiryError });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to load account details.", { cause: profileError });
  }
  if (profile?.role !== "pharmacy") redirect("/search");

  const { data: pharmacyData, error: pharmacyError } = await supabase
    .from("pharmacies")
    .select("id, name, address")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (pharmacyError) {
    throw new Error("Unable to load your pharmacy.", { cause: pharmacyError });
  }

  const pharmacy = pharmacyData as Pharmacy | null;
  if (!pharmacy) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6 font-sans text-ink-900">
        <section className="rounded-xl border border-line bg-background p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">No pharmacy is linked to your account yet</h1>
          <p className="mt-2 text-sm text-ink-600">Please contact an administrator to link your pharmacy.</p>
        </section>
      </main>
    );
  }

  const [
    { data: inventoryData, error: inventoryError },
    { data: reservationData, error: reservationError },
    { data: medicineData, error: medicineError },
  ] =
    await Promise.all([
      supabase
        .from("inventory")
        .select("id, medicine_id, quantity, low_stock_threshold, batch_no, expiry_date, medicines!inner(brand_name, strength)")
        .eq("pharmacy_id", pharmacy.id)
        .order("expiry_date", { ascending: true }),
      supabase
        .from("reservations")
        .select("id, quantity, status, expires_at, created_at, updated_at, medicines!inner(brand_name, strength), profiles!inner(full_name)")
        .eq("pharmacy_id", pharmacy.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("medicines")
        .select("id, brand_name, generic_name, strength")
        .order("brand_name", { ascending: true }),
    ]);

  if (inventoryError || reservationError || medicineError) {
    throw new Error("Unable to load pharmacy dashboard data.", {
      cause: inventoryError ?? reservationError ?? medicineError,
    });
  }

  const inventory = (inventoryData ?? []) as InventoryRow[];
  const reservations = (reservationData ?? []) as ReservationRow[];
  const medicines = (medicineData ?? []) as MedicineOption[];
  const now = new Date();
  const nowTimestamp = now.getTime();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysFromNow = new Date(nowTimestamp + 30 * 86_400_000).toISOString().slice(0, 10);
  const alerts = inventory.flatMap((row) => {
    const medicine = joinedValue(row.medicines);
    if (!medicine) throw new Error("Inventory record is missing its medicine.");
    const label = `${medicine.brand_name}${medicine.strength ? ` ${medicine.strength}` : ""}`;
    const items = [];
    if (row.quantity === 0) items.push({ tone: "danger", title: "Out of stock", detail: `${label} has no usable stock.` });
    else if (row.quantity <= row.low_stock_threshold) {
      items.push({ tone: "warning", title: "Low stock", detail: `${label}: ${row.quantity} left (threshold ${row.low_stock_threshold}).` });
    }
    if (isExpiringSoon(row.expiry_date, today, thirtyDaysFromNow)) {
      const days = Math.max(0, Math.ceil((new Date(`${row.expiry_date}T00:00:00`).getTime() - nowTimestamp) / 86_400_000));
      items.push({ tone: "danger", title: "Expiring soon", detail: `${label}, batch ${row.batch_no ?? "—"} expires in ${days} days.` });
    }
    return items;
  });

  const pendingReservations = reservations.filter((reservation) => reservation.status === "pending");
  const completedToday = reservations.filter(
    (reservation) => reservation.status === "completed" && reservation.updated_at.slice(0, 10) === today,
  ).length;
  const lowStockCount = inventory.filter((row) => row.quantity <= row.low_stock_threshold).length;
  const expiringCount = inventory.filter((row) => isExpiringSoon(row.expiry_date, today, thirtyDaysFromNow)).length;

  return (
    <div className="flex min-h-screen bg-surface font-sans text-ink-900">
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-line bg-background px-4 py-6 md:flex">
        <div>
          <div className="flex items-center gap-2 pl-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary-600 text-xl font-semibold text-white">+</span>
            <span className="text-xl font-bold">MediFind</span>
          </div>
          <nav className="mt-7 space-y-1 text-[13px] font-medium" aria-label="Dashboard sections">
            <a href="#overview" className="block rounded-lg bg-primary-50 px-3 py-2.5 text-primary-600">Overview</a>
            <a href="#reservations" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-ink-600 hover:bg-primary-50">
              Reservations <span className="rounded-full bg-surface px-2 py-0.5 text-xs">{pendingReservations.length}</span>
            </a>
            <a href="#inventory" className="block rounded-lg px-3 py-2.5 text-ink-600 hover:bg-primary-50">Inventory</a>
            <a href="#alerts" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-ink-600 hover:bg-primary-50">
              Alerts <span className="rounded-full bg-surface px-2 py-0.5 text-xs">{alerts.length}</span>
            </a>
            <a href="#profile" className="block rounded-lg px-3 py-2.5 text-ink-600 hover:bg-primary-50">Pharmacy profile</a>
          </nav>
        </div>
        <div id="profile" className="rounded-lg bg-surface p-3">
          <p className="text-sm font-semibold">{pharmacy.name}</p>
          <p className="mt-1 truncate text-xs text-ink-600">{pharmacy.address ?? "Address unavailable"}</p>
          <div className="mt-3"><LogoutButton /></div>
        </div>
      </aside>

      <main className="w-full px-5 py-7 sm:px-8 lg:px-10">
        <div id="overview" className="mx-auto max-w-[1100px]">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Pharmacy dashboard</h1>
                <span className="rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600">Approved</span>
              </div>
              <p className="mt-1 text-xs text-ink-600">{pharmacy.name} · {pharmacy.address ?? "Address unavailable"}</p>
            </div>
            <StockModal medicines={medicines} />
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Pharmacy statistics">
            {[
              ["Pending reservations", pendingReservations.length, "Awaiting your response", "warning"],
              ["Low-stock items", lowStockCount, `${lowStockCount} need attention`, "danger"],
              ["Expiring in 30 days", expiringCount, "Batches to review", "warning"],
              ["Completed today", completedToday, "Pickups finished", "success"],
            ].map(([label, value, note, tone]) => (
              <article key={label} className="rounded-xl border border-line bg-background p-4">
                <p className="text-xs text-ink-600">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${tone === "success" ? "bg-success-50 text-success-600" : tone === "danger" ? "bg-danger-50 text-danger-600" : "bg-warning-50 text-warning-600"}`}>{note}</span>
              </article>
            ))}
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
            <section id="reservations" className="rounded-xl border border-line bg-background p-4" aria-labelledby="queue-title">
              <div className="flex items-center justify-between">
                <h2 id="queue-title" className="text-sm font-bold">Reservation queue</h2>
                <a href="#reservations" className="text-xs font-semibold text-primary-600">View all</a>
              </div>
              <div className="mt-4 divide-y divide-line">
                {reservations.length === 0 ? <p className="py-6 text-sm text-ink-600">No reservations yet.</p> : reservations.map((reservation) => {
                  const medicine = joinedValue(reservation.medicines);
                  const patient = joinedValue(reservation.profiles);
                  if (!medicine || !patient) throw new Error("Reservation record is missing its medicine or patient.");
                  return (
                    <div key={reservation.id} className="flex flex-col gap-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{patient.full_name ?? "Patient"}</p>
                        <p className="mt-1 text-ink-600">{medicine.brand_name}{medicine.strength ? ` ${medicine.strength}` : ""} · Qty {reservation.quantity}</p>
                      </div>
                      <span className="shrink-0 text-ink-600">{reservation.status === "pending" || reservation.status === "confirmed" ? formatTimeLeft(reservation.expires_at, nowTimestamp) : reservation.status}</span>
                      <div className="flex shrink-0 gap-2">
                        {reservation.status === "pending" ? (
                          <>
                            <form action={updateReservationStatusFromForm.bind(null, reservation.id, "confirmed")}><button type="submit" className="rounded-lg bg-primary-600 px-3 py-1.5 font-semibold text-white hover:bg-primary-700">Confirm</button></form>
                            <form action={updateReservationStatusFromForm.bind(null, reservation.id, "rejected")}><button type="submit" className="rounded-lg border border-line px-3 py-1.5 font-semibold text-danger-600 hover:bg-danger-50">Reject</button></form>
                          </>
                        ) : reservation.status === "confirmed" ? (
                          <form action={updateReservationStatusFromForm.bind(null, reservation.id, "completed")}><button type="submit" className="rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-surface">Mark completed</button></form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="alerts" className="rounded-xl border border-line bg-background p-4" aria-labelledby="alerts-title">
              <div className="flex items-center justify-between">
                <h2 id="alerts-title" className="text-sm font-bold">Alerts</h2>
                <span className="rounded-full bg-danger-50 px-2 py-1 text-[10px] font-semibold text-danger-600">{alerts.length} new</span>
              </div>
              <div className="mt-3 space-y-2">
                {alerts.length === 0 ? <p className="text-sm text-ink-600">No inventory alerts.</p> : alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className={`rounded-lg px-3 py-2.5 ${alert.tone === "danger" ? "bg-danger-50" : "bg-warning-50"}`}>
                    <p className={`text-xs font-semibold ${alert.tone === "danger" ? "text-danger-600" : "text-warning-600"}`}>{alert.title}</p>
                    <p className="mt-1 text-[11px] text-ink-600">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section id="inventory" className="mt-5 rounded-xl border border-line bg-background p-4" aria-labelledby="inventory-title">
            <h2 id="inventory-title" className="text-sm font-bold">Inventory</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-line text-ink-600">
                  <tr>{["Medicine", "Batch", "Quantity", "Threshold", "Expiry", "Status", "Action"].map((heading) => <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {inventory.map((row) => {
                    const medicine = joinedValue(row.medicines);
                    if (!medicine) throw new Error("Inventory record is missing its medicine.");
                    const outOfStock = row.quantity === 0;
                    const lowStock = row.quantity <= row.low_stock_threshold;
                    const expiring = isExpiringSoon(row.expiry_date, today, thirtyDaysFromNow);
                    return (
                      <tr key={row.id}>
                        <td className="py-3 pr-4 font-semibold">{medicine.brand_name}{medicine.strength ? ` ${medicine.strength}` : ""}</td>
                        <td className="py-3 pr-4 text-ink-600">{row.batch_no ?? "—"}</td>
                        <td className="py-3 pr-4">{row.quantity}</td>
                        <td className="py-3 pr-4 text-ink-600">{row.low_stock_threshold}</td>
                        <td className={`py-3 pr-4 ${expiring ? "font-semibold text-danger-600" : "text-ink-600"}`}>{formatExpiry(row.expiry_date)}</td>
                        <td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${outOfStock ? "bg-danger-50 text-danger-600" : lowStock ? "bg-warning-50 text-warning-600" : "bg-success-50 text-success-600"}`}>{outOfStock ? "Out of stock" : lowStock ? "Low stock" : "In stock"}</span></td>
                        <td className="py-3">
                          <StockModal
                            medicines={medicines}
                            inventory={{
                              id: row.id,
                              medicine_id: row.medicine_id,
                              quantity: row.quantity,
                              low_stock_threshold: row.low_stock_threshold,
                              batch_no: row.batch_no,
                              expiry_date: row.expiry_date,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
