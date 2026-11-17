import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type UserRole = "patient" | "pharmacy" | "admin";
type PharmacyStatus = "pending" | "approved" | "suspended";

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load admin profile.", profileError);
    throw new Error("Unable to load account details.", { cause: profileError });
  }
  if (profile?.role !== "admin") redirect("/search");

  const [
    { data: usersData, error: usersError },
    { data: pharmaciesData, error: pharmaciesError },
    { data: medicinesData, error: medicinesError },
    { data: reservationsData, error: reservationsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").order("created_at", { ascending: false }),
    supabase.from("pharmacies").select("id, name, address, status, profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("medicines").select("id, brand_name, generic_name, strength, form, category").order("brand_name", { ascending: true }),
    supabase.from("reservations").select("status"),
  ]);

  const queryError = usersError ?? pharmaciesError ?? medicinesError ?? reservationsError;
  if (queryError) {
    console.error("Failed to load admin dashboard data.", queryError);
    throw new Error("Unable to load admin dashboard data.", { cause: queryError });
  }

  const users = (usersData ?? []) as Array<{ id: string; full_name: string | null; role: UserRole }>;
  const pharmacies = (pharmaciesData ?? []).map((pharmacy) => {
    const owner = Array.isArray(pharmacy.profiles) ? pharmacy.profiles[0] : pharmacy.profiles;
    return {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      status: pharmacy.status as PharmacyStatus,
      ownerName: owner?.full_name ?? null,
    };
  });
  const medicines = (medicinesData ?? []).map((medicine) => ({
    id: medicine.id,
    brand_name: medicine.brand_name,
    generic_name: medicine.generic_name,
    strength: medicine.strength,
    form: medicine.form,
    category: medicine.category,
  }));
  const usersByRole = { patient: 0, pharmacy: 0, admin: 0 };
  users.forEach(({ role }) => { usersByRole[role] += 1; });
  const pharmaciesByStatus = { pending: 0, approved: 0, suspended: 0 };
  pharmacies.forEach(({ status }) => { pharmaciesByStatus[status] += 1; });
  const reservationsByStatus: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
  };
  (reservationsData ?? []).forEach(({ status }) => { reservationsByStatus[status] = (reservationsByStatus[status] ?? 0) + 1; });

  return (
    <AdminDashboard
      users={users}
      pharmacies={pharmacies}
      medicines={medicines}
      stats={{ users: usersByRole, pharmacies: pharmaciesByStatus, medicines: medicines.length, reservations: reservationsByStatus }}
    />
  );
}
