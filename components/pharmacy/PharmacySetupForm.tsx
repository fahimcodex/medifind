"use client";

import { useActionState, useState } from "react";
import { createPharmacy, type PharmacySetupState } from "@/app/actions/pharmacy";

const initialState: PharmacySetupState = {};

export function PharmacySetupForm() {
  const [state, formAction, isPending] = useActionState(createPharmacy, initialState);
  const [locationError, setLocationError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  function useCurrentLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(6));
        setLongitude(coords.longitude.toFixed(6));
      },
      () => setLocationError("Unable to get your location. Please enter the coordinates manually."),
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">Pharmacy name</span>
          <input name="name" required className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">Address</span>
          <textarea name="address" required rows={3} className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Phone</span>
          <input name="phone" type="tel" required className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Opening hours</span>
          <input name="opening_hours" required placeholder="e.g. Mon–Sat, 9:00 AM–9:00 PM" className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
        </label>
        <div className="sm:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold">Location</p>
              <p className="mt-1 text-xs text-ink-600">Add coordinates so customers can find your pharmacy.</p>
            </div>
            <button type="button" onClick={useCurrentLocation} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50">
              Use my current location
            </button>
          </div>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-ink-600">Latitude</span>
              <input name="latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-ink-600">Longitude</span>
              <input name="longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-50" />
            </label>
          </div>
        </div>
      </div>
      {locationError || state.error ? <p role="alert" className="text-sm text-danger-600">{locationError || state.error}</p> : null}
      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Submitting..." : "Submit for approval"}
      </button>
    </form>
  );
}
