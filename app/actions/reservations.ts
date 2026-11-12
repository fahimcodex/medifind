"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function createReservation(
  pharmacyId: string,
  medicineId: string,
  quantity: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_reservation", {
    p_pharmacy_id: pharmacyId,
    p_medicine_id: medicineId,
    p_quantity: quantity,
  });

  if (error) {
    return { error: error.message };
  }

  return { id: data };
}

export async function updateReservationStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_reservation_status", {
    p_id: id,
    p_status: status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reservations");
  revalidatePath("/pharmacy/dashboard");

  return { ok: true };
}

export async function updateReservationStatusFromForm(
  id: string,
  status: string,
  _formData: FormData,
) {
  void _formData;
  await updateReservationStatus(id, status);
}
