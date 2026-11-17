"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = {
  error?: string;
  ok?: boolean;
};

type MedicineInput = {
  id?: string;
  brandName: string;
  genericName: string;
  strength: string;
  form: string;
  category: string;
};

async function getAdminClient() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: "You must be signed in as an admin." };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify admin role.", error);
    return { error: "Unable to verify your admin access." };
  }
  if (profile?.role !== "admin") return { error: "Only admins can perform this action." };

  return { supabase };
}

export async function updatePharmacyStatus(
  pharmacyId: string,
  nextStatus: "pending" | "approved" | "suspended",
): Promise<AdminActionResult> {
  const admin = await getAdminClient();
  if (!admin.supabase) return { error: admin.error };
  if (!pharmacyId) return { error: "A pharmacy is required." };

  const { data: pharmacy, error: readError } = await admin.supabase
    .from("pharmacies")
    .select("status")
    .eq("id", pharmacyId)
    .maybeSingle();
  if (readError) {
    console.error("Failed to read pharmacy status.", readError);
    return { error: "Unable to verify the pharmacy status." };
  }
  if (!pharmacy) return { error: "The pharmacy was not found." };

  const allowedTransitions: Record<string, string> = {
    pending: "approved",
    approved: "suspended",
    suspended: "approved",
  };
  if (allowedTransitions[pharmacy.status] !== nextStatus) {
    return { error: "That pharmacy status change is not allowed." };
  }

  const { data, error } = await admin.supabase
    .from("pharmacies")
    .update({ status: nextStatus })
    .eq("id", pharmacyId)
    .eq("status", pharmacy.status)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update pharmacy status.", error);
    return { error: "Unable to update the pharmacy status." };
  }
  if (!data) return { error: "The pharmacy status changed or the pharmacy was not found." };

  revalidatePath("/admin");
  return { ok: true };
}

function normalizeMedicineInput(input: MedicineInput) {
  const medicine = {
    brand_name: input.brandName.trim(),
    generic_name: input.genericName.trim(),
    strength: input.strength.trim() || null,
    form: input.form.trim() || null,
    category: input.category.trim() || null,
  };

  if (!medicine.brand_name || !medicine.generic_name) {
    return { error: "Brand name and generic name are required." };
  }
  return { medicine };
}

export async function saveMedicine(input: MedicineInput): Promise<AdminActionResult> {
  const admin = await getAdminClient();
  if (!admin.supabase) return { error: admin.error };

  const normalized = normalizeMedicineInput(input);
  if (!normalized.medicine) return { error: normalized.error };

  const query = input.id
    ? admin.supabase.from("medicines").update(normalized.medicine).eq("id", input.id)
    : admin.supabase.from("medicines").insert(normalized.medicine);
  const { error } = await query;

  if (error) {
    console.error("Failed to save medicine.", error);
    return { error: "Unable to save the medicine." };
  }

  revalidatePath("/admin");
  revalidatePath("/search");
  return { ok: true };
}

export async function deleteMedicine(id: string): Promise<AdminActionResult> {
  const admin = await getAdminClient();
  if (!admin.supabase) return { error: admin.error };
  if (!id) return { error: "A medicine is required." };

  const { data, error } = await admin.supabase
    .from("medicines")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete medicine.", error);
    return { error: "Unable to delete the medicine. Remove its inventory first if needed." };
  }
  if (!data) return { error: "The medicine was not found." };

  revalidatePath("/admin");
  revalidatePath("/search");
  return { ok: true };
}
