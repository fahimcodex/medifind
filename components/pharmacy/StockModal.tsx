"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { saveInventory } from "@/app/actions/inventory";

type MedicineOption = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
};

type InventoryItem = {
  id: string;
  medicine_id: string;
  quantity: number;
  low_stock_threshold: number;
  batch_no: string | null;
  expiry_date: string | null;
};

type StockModalProps = {
  medicines: MedicineOption[];
  inventory?: InventoryItem;
};

export function StockModal({ medicines, inventory }: StockModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [medicineId, setMedicineId] = useState(inventory?.medicine_id ?? "");
  const [quantity, setQuantity] = useState(String(inventory?.quantity ?? 0));
  const [threshold, setThreshold] = useState(String(inventory?.low_stock_threshold ?? 10));
  const [batchNo, setBatchNo] = useState(inventory?.batch_no ?? "");
  const [expiryDate, setExpiryDate] = useState(inventory?.expiry_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedThreshold = Number(threshold);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setError("Quantity must be a whole number of 0 or more.");
      return;
    }
    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
      setError("Low-stock threshold must be a whole number of 0 or more.");
      return;
    }
    if (!medicineId) {
      setError("Select a medicine.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveInventory({
        id: inventory?.id,
        medicineId,
        quantity: parsedQuantity,
        lowStockThreshold: parsedThreshold,
        batchNo,
        expiryDate,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={inventory ? "font-semibold text-primary-600" : "rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"}
      >
        {inventory ? "Edit" : "+ Add stock"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 px-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="stock-modal-title" className="w-full max-w-lg rounded-xl border border-line bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="stock-modal-title" className="text-lg font-bold">{inventory ? "Edit stock" : "Add stock"}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-xl text-ink-600 hover:text-ink-900">×</button>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Medicine
                <select value={medicineId} onChange={(event) => setMedicineId(event.target.value)} required className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm">
                  <option value="">Select a medicine</option>
                  {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.brand_name} ({medicine.generic_name}){medicine.strength ? ` ${medicine.strength}` : ""}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Batch number
                  <input value={batchNo} onChange={(event) => setBatchNo(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium">
                  Expiry date
                  <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium">
                  Quantity
                  <input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium">
                  Low-stock threshold
                  <input type="number" min="0" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} required className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              {error ? <p role="alert" className="text-sm text-danger-600">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface">Cancel</button>
                <button type="submit" disabled={isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Saving..." : "Save stock"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
