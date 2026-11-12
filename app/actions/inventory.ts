"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type InventoryInput = {
  id?: string;
  medicineId: string;
  quantity: number;
  lowStockThreshold: number;
  batchNo: string;
  expiryDate: string;
};

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

export async function saveInventory(input: InventoryInput) {
  if (!input.medicineId || !isNonNegativeInteger(input.quantity) || !isNonNegativeInteger(input.lowStockThreshold)) {
    return { error: "Quantity and low-stock threshold must be whole numbers of 0 or more." };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return { error: userError.message };
  if (!userData.user) return { error: "You must be signed in to manage inventory." };

  const { data: pharmacy, error: pharmacyError } = await supabase
    .from("pharmacies")
    .select("id")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (pharmacyError) return { error: pharmacyError.message };
  if (!pharmacy) return { error: "No pharmacy is linked to your account." };

  const values = {
    medicine_id: input.medicineId,
    quantity: input.quantity,
    low_stock_threshold: input.lowStockThreshold,
    batch_no: input.batchNo.trim() || null,
    expiry_date: input.expiryDate || null,
  };

  const query = input.id
    ? supabase.from("inventory").update(values).eq("id", input.id).eq("pharmacy_id", pharmacy.id)
    : supabase.from("inventory").insert({ ...values, pharmacy_id: pharmacy.id });
  const { error } = await query;

  if (error) return { error: error.message };

  revalidatePath("/pharmacy/dashboard");
  return { ok: true };
}
