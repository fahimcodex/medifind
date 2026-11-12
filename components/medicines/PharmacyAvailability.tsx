import { PharmacyResults, type PharmacyResult } from "@/components/medicine/PharmacyResults";
import { PharmacyMap } from "@/components/map/PharmacyMap";

type PharmacyAvailabilityProps = {
  pharmacies: PharmacyResult[];
};

export function PharmacyAvailability({ pharmacies }: PharmacyAvailabilityProps) {
  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start">
      <PharmacyResults pharmacies={pharmacies} />
      <aside aria-label="Pharmacy locations">
        <PharmacyMap pharmacies={pharmacies} selectedPharmacyId={null} />
      </aside>
    </div>
  );
}
