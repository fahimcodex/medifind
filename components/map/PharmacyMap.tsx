"use client";

import dynamic from "next/dynamic";
import type { PharmacyResult } from "@/components/medicines/PharmacyResults";
import "leaflet/dist/leaflet.css";

type PharmacyMapProps = {
  pharmacies: PharmacyResult[];
  selectedPharmacyId: string | null;
};

const PharmacyMapContent = dynamic(() => import("./PharmacyMapContent"), {
  ssr: false,
});

export function PharmacyMap({ pharmacies, selectedPharmacyId }: PharmacyMapProps) {
  return (
    <PharmacyMapContent
      pharmacies={pharmacies}
      selectedPharmacyId={selectedPharmacyId}
    />
  );
}
