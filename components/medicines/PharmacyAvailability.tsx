"use client";

import { PharmacyMap } from "@/components/map/PharmacyMap";
import { PharmacyResults, type PharmacyResult } from "@/components/medicines/PharmacyResults";
import { useState } from "react";

type PharmacyAvailabilityProps = {
  pharmacies: PharmacyResult[];
};

export function PharmacyAvailability({ pharmacies }: PharmacyAvailabilityProps) {
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);

  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start">
      <PharmacyResults
        pharmacies={pharmacies}
        selectedPharmacyId={selectedPharmacyId}
        onSelectPharmacy={setSelectedPharmacyId}
      />
      <aside className="lg:sticky lg:top-6" aria-label="Pharmacy map">
        <PharmacyMap
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
        />
      </aside>
    </div>
  );
}
