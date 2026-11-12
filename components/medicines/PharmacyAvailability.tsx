import { PharmacyResults, type PharmacyResult } from "@/components/medicine/PharmacyResults";

type PharmacyAvailabilityProps = {
  pharmacies: PharmacyResult[];
};

export function PharmacyAvailability({ pharmacies }: PharmacyAvailabilityProps) {
  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start">
      <PharmacyResults pharmacies={pharmacies} />
      <aside
        className="min-h-[520px] rounded-2xl border border-line bg-[#edf2f7]"
        aria-label="Pharmacy map placeholder"
      >
        <div className="grid min-h-[520px] place-items-center px-6 text-center">
          <p className="rounded-lg border border-dashed border-ink-400 bg-white/70 px-4 py-3 text-sm text-ink-600">
            Map preview
          </p>
        </div>
      </aside>
    </div>
  );
}
