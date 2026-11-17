"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type PharmacySetupState = {
  error?: string;
};

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getCoordinate(formData: FormData, name: string, min: number, max: number) {
  const value = getText(formData, name);
  if (!value) return null;

  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw new Error(`${name === "latitude" ? "Latitude" : "Longitude"} must be a valid coordinate.`);
  }

  return coordinate;
}

export async function createPharmacy(
  _previousState: PharmacySetupState,
  formData: FormData,
): Promise<PharmacySetupState> {
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const phone = getText(formData, "phone");
  const openingHours = getText(formData, "opening_hours");

  if (!name || !address || !phone || !openingHours) {
    return { error: "Name, address, phone, and opening hours are required." };
  }

  let latitude: number | null;
  let longitude: number | null;
  try {
    latitude = getCoordinate(formData, "latitude", -90, 90);
    longitude = getCoordinate(formData, "longitude", -180, 180);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Coordinates are invalid." };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: "You must be signed in to create a pharmacy." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to verify pharmacy owner role.", profileError);
    return { error: "Unable to verify your account." };
  }
  if (profile?.role !== "pharmacy") {
    return { error: "Only pharmacy accounts can create a pharmacy." };
  }

  const { error } = await supabase.from("pharmacies").insert({
    owner_id: user.id,
    name,
    address,
    phone,
    opening_hours: openingHours,
    latitude,
    longitude,
    status: "pending",
  });

  if (error) {
    console.error("Failed to create pharmacy.", error);
    return { error: "Unable to create your pharmacy. Please try again." };
  }

  redirect("/pharmacy/dashboard");
}
