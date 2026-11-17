"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteMedicine, saveMedicine, updatePharmacyStatus } from "@/app/actions/admin";
import { LogoutButton } from "@/components/auth/LogoutButton";

type PharmacyStatus = "pending" | "approved" | "suspended";
type Medicine = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
  form: string | null;
  category: string | null;
};
type Pharmacy = { id: string; name: string; address: string | null; status: PharmacyStatus; ownerName: string | null };
type User = { id: string; full_name: string | null; role: "patient" | "pharmacy" | "admin" };
type Stats = {
  users: Record<User["role"], number>;
  pharmacies: Record<PharmacyStatus, number>;
  medicines: number;
  reservations: Record<string, number>;
};
type Props = { stats: Stats; pharmacies: Pharmacy[]; medicines: Medicine[]; users: User[] };
type MedicineForm = { id?: string; brandName: string; genericName: string; strength: string; form: string; category: string };

const emptyMedicine: MedicineForm = { brandName: "", genericName: "", strength: "", form: "", category: "" };

function statusClass(status: string) {
  if (status === "approved" || status === "completed") return "bg-success-50 text-success-600";
  if (status === "suspended" || status === "rejected" || status === "cancelled") return "bg-danger-50 text-danger-600";
  return "bg-warning-50 text-warning-600";
}

export function AdminDashboard({ stats, pharmacies, medicines, users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [modal, setModal] = useState<MedicineForm | null>(null);

  function run(action: () => Promise<{ error?: string }>, onSuccess?: () => void) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  function submitMedicine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal) run(() => saveMedicine(modal), () => setModal(null));
  }

  function confirmDelete(medicine: Medicine) {
    if (!window.confirm(`Delete ${medicine.brand_name}? This can also remove related inventory.`)) return;
    run(() => deleteMedicine(medicine.id));
  }

  const statCards = [
    ["Patients", stats.users.patient, "Users", "primary"],
    ["Pharmacy accounts", stats.users.pharmacy, "Users", "primary"],
    ["Admins", stats.users.admin, "Users", "primary"],
    ["Medicines", stats.medicines, "Catalog entries", "success"],
    ["Pending pharmacies", stats.pharmacies.pending, "Needs review", "warning"],
    ["Approved pharmacies", stats.pharmacies.approved, "Live listings", "success"],
    ["Suspended pharmacies", stats.pharmacies.suspended, "Not visible", "danger"],
    ...Object.entries(stats.reservations).map(([status, count]) => [`Reservations: ${status}`, count, "Reservations", "primary"] as const),
  ] as const;

  return (
    <div className="flex min-h-screen bg-surface font-sans text-ink-900">
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-line bg-background px-4 py-6 md:flex">
        <div>
          <div className="flex items-center gap-2 pl-2"><span className="grid size-9 place-items-center rounded-lg bg-primary-600 text-xl font-semibold text-white">+</span><span className="text-xl font-bold">MediFind</span></div>
          <nav className="mt-7 space-y-1 text-[13px] font-medium" aria-label="Admin sections">
            {[["Overview", "#overview"], ["Pharmacies", "#pharmacies"], ["Medicine catalog", "#medicines"], ["Users", "#users"]].map(([label, href], index) => <a key={href} href={href} className={`block rounded-lg px-3 py-2.5 ${index === 0 ? "bg-primary-50 text-primary-600" : "text-ink-600 hover:bg-primary-50"}`}>{label}</a>)}
          </nav>
        </div>
        <div className="rounded-lg bg-surface p-3"><p className="text-sm font-semibold">Admin account</p><p className="mt-1 text-xs text-ink-600">Manage MediFind</p><div className="mt-3"><LogoutButton /></div></div>
      </aside>

      <main className="w-full px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <header id="overview">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin dashboard</h1>
            <p className="mt-1 text-sm text-ink-600">Review pharmacies, maintain the medicine catalog, and monitor users.</p>
          </header>
          {error ? <p role="alert" className="mt-5 rounded-lg border border-danger-600/20 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">{error}</p> : null}

          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Admin statistics">
            {statCards.map(([label, value, note, tone]) => <article key={label} className="rounded-xl border border-line bg-background p-4"><p className="text-xs text-ink-600">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${tone === "success" ? "bg-success-50 text-success-600" : tone === "danger" ? "bg-danger-50 text-danger-600" : tone === "warning" ? "bg-warning-50 text-warning-600" : "bg-primary-50 text-primary-600"}`}>{note}</span></article>)}
          </section>

          <section id="pharmacies" className="mt-5 rounded-xl border border-line bg-background p-4" aria-labelledby="pharmacies-title">
            <div className="flex items-center justify-between"><h2 id="pharmacies-title" className="text-sm font-bold">Pharmacies</h2><span className="text-xs text-ink-600">{pharmacies.length} total</span></div>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-line text-ink-600"><tr>{["Name", "Address", "Owner", "Status", "Action"].map((heading) => <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">
              {pharmacies.map((pharmacy) => <tr key={pharmacy.id}><td className="py-3 pr-4 font-semibold">{pharmacy.name}</td><td className="max-w-56 py-3 pr-4 text-ink-600">{pharmacy.address ?? "—"}</td><td className="py-3 pr-4 text-ink-600">{pharmacy.ownerName ?? "Demo pharmacy"}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(pharmacy.status)}`}>{pharmacy.status[0].toUpperCase() + pharmacy.status.slice(1)}</span></td><td className="py-3">{pharmacy.status === "pending" ? <button type="button" disabled={isPending} onClick={() => run(() => updatePharmacyStatus(pharmacy.id, "approved"))} className="rounded-lg bg-primary-600 px-3 py-1.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60">Approve</button> : pharmacy.status === "approved" ? <button type="button" disabled={isPending} onClick={() => run(() => updatePharmacyStatus(pharmacy.id, "suspended"))} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-danger-600 hover:bg-danger-50 disabled:opacity-60">Suspend</button> : <button type="button" disabled={isPending} onClick={() => run(() => updatePharmacyStatus(pharmacy.id, "approved"))} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-60">Reactivate</button>}</td></tr>)}
            </tbody></table>{pharmacies.length === 0 ? <p className="py-6 text-sm text-ink-600">No pharmacies found.</p> : null}</div>
          </section>

          <section id="medicines" className="mt-5 rounded-xl border border-line bg-background p-4" aria-labelledby="medicines-title">
            <div className="flex items-center justify-between gap-3"><h2 id="medicines-title" className="text-sm font-bold">Medicine catalog</h2><button type="button" onClick={() => { setError(""); setModal(emptyMedicine); }} className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">+ Add medicine</button></div>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="border-b border-line text-ink-600"><tr>{["Brand", "Generic", "Strength", "Form", "Category", "Action"].map((heading) => <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">
              {medicines.map((medicine) => <tr key={medicine.id}><td className="py-3 pr-4 font-semibold">{medicine.brand_name}</td><td className="py-3 pr-4">{medicine.generic_name}</td><td className="py-3 pr-4 text-ink-600">{medicine.strength ?? "—"}</td><td className="py-3 pr-4 text-ink-600">{medicine.form ?? "—"}</td><td className="py-3 pr-4 text-ink-600">{medicine.category ?? "—"}</td><td className="py-3"><div className="flex gap-3"><button type="button" onClick={() => { setError(""); setModal({ id: medicine.id, brandName: medicine.brand_name, genericName: medicine.generic_name, strength: medicine.strength ?? "", form: medicine.form ?? "", category: medicine.category ?? "" }); }} className="font-semibold text-primary-600 hover:text-primary-700">Edit</button><button type="button" disabled={isPending} onClick={() => confirmDelete(medicine)} className="font-semibold text-danger-600 hover:text-danger-700 disabled:opacity-60">Delete</button></div></td></tr>)}
            </tbody></table>{medicines.length === 0 ? <p className="py-6 text-sm text-ink-600">No medicines found.</p> : null}</div>
          </section>

          <section id="users" className="mt-5 rounded-xl border border-line bg-background p-4" aria-labelledby="users-title"><div className="flex items-center justify-between"><h2 id="users-title" className="text-sm font-bold">Users</h2><span className="text-xs text-ink-600">{users.length} total</span></div><div className="mt-4 overflow-x-auto"><table className="w-full max-w-xl text-left text-xs"><thead className="border-b border-line text-ink-600"><tr><th className="pb-3 pr-4 font-medium">Name</th><th className="pb-3 font-medium">Role</th></tr></thead><tbody className="divide-y divide-line">{users.map((user) => <tr key={user.id}><td className="py-3 pr-4 font-semibold">{user.full_name ?? "Unnamed user"}</td><td className="py-3"><span className="rounded-full bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-600">{user.role}</span></td></tr>)}</tbody></table></div></section>
        </div>
      </main>

      {modal ? <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 px-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section role="dialog" aria-modal="true" aria-labelledby="medicine-modal-title" className="w-full max-w-lg rounded-xl border border-line bg-background p-6 shadow-xl"><div className="flex items-center justify-between"><h2 id="medicine-modal-title" className="text-lg font-bold">{modal.id ? "Edit medicine" : "Add medicine"}</h2><button type="button" onClick={() => setModal(null)} aria-label="Close" className="text-xl text-ink-600 hover:text-ink-900">×</button></div><form onSubmit={submitMedicine} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2">{([["brandName", "Brand name"], ["genericName", "Generic name"], ["strength", "Strength"], ["form", "Form"], ["category", "Category"]] as const).map(([field, label]) => <label key={field} className="block"><span className="text-sm font-semibold">{label}</span><input name={field} value={modal[field]} onChange={(event) => setModal({ ...modal, [field]: event.target.value })} required={field === "brandName" || field === "genericName"} className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" /></label>)}</div><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface">Cancel</button><button type="submit" disabled={isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">{isPending ? "Saving..." : "Save medicine"}</button></div></form></section></div> : null}
    </div>
  );
}
