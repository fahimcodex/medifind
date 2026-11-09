"use client";

import { formatDistance, haversineKm } from "@/lib/geo";
import { StockBadge } from "@/components/search/StockBadge";
import type { StockStatus } from "@/lib/stock";
import { useEffect, useMemo, useState } from "react";

export type PharmacyResult = {
  id: string;
  name: string;
  address: string | null;
  openingHours: string | null;
  latitude: number | null;
  longitude: number | null;
  status: StockStatus;
  quantity: number;
};

type PharmacyResultsProps = {
  pharmacies: PharmacyResult[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacyId: string) => void;
};

const defaultLocation = { latitude: 23.7806, longitude: 90.4075 };

export function PharmacyResults({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
}: PharmacyResultsProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_stock">("all");

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setUsingDefaultLocation(false);
      },
      () => {
        setUsingDefaultLocation(true);
      },
    );
  }, []);

  const sortedPharmacies = useMemo(() => {
    const results = pharmacies
      .filter((pharmacy) => filter === "all" || pharmacy.status !== "out_of_stock")
      .map((pharmacy) => {
        const distance =
          pharmacy.latitude !== null && pharmacy.longitude !== null
            ? haversineKm(
                location.latitude,
                location.longitude,
                pharmacy.latitude,
                pharmacy.longitude,
              )
            : null;

        return { pharmacy, distance };
      });

    return results.sort((first, second) => {
      if (first.distance === null) return 1;
      if (second.distance === null) return -1;
      return first.distance - second.distance;
    });
  }, [filter, location, pharmacies]);

  return (
    <section aria-labelledby="pharmacy-results-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="pharmacy-results-heading" className="text-2xl font-bold tracking-[-0.03em]">
            Pharmacy availability
          </h2>
        </div>
        <div className="flex gap-2" aria-label="Filter pharmacies">
          {[
            ["all", "All"],
            ["in_stock", "In stock only"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as "all" | "in_stock")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                filter === value
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-line bg-surface text-ink-600 hover:border-primary-600 hover:text-primary-600"
              }`}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-ink-400">
          {usingDefaultLocation ? "Using default location (Dhaka)" : "Using your current location"}
        </p>
        <p className="font-medium text-ink-600">Sorted by distance · nearest first</p>
      </div>

      <div className="mt-6 grid gap-4">
        {sortedPharmacies.length > 0 ? (
          sortedPharmacies.map(({ pharmacy, distance }, index) => (
            <article
              key={pharmacy.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPharmacy(pharmacy.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectPharmacy(pharmacy.id);
                }
              }}
              className={`cursor-pointer rounded-xl border bg-background px-4 py-4 transition-shadow ${
                selectedPharmacyId === pharmacy.id
                  ? "border-2 border-primary-600 shadow-md"
                  : index === 0 && pharmacy.status !== "out_of_stock"
                    ? "border-2 border-primary-600"
                    : "border-line"
              }`}
              aria-pressed={selectedPharmacyId === pharmacy.id}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">{pharmacy.name}</h3>
                <StockBadge status={pharmacy.status} />
              </div>
              <p className="mt-2 text-xs text-ink-600">
                {pharmacy.address ?? "Address unavailable"} · {pharmacy.openingHours ?? "Hours unavailable"}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-ink-600">
                  {distance === null ? "Distance unavailable" : `${formatDistance(distance)} away`} ·{" "}
                  {pharmacy.status === "low_stock"
                    ? `Only ${pharmacy.quantity} left`
                    : pharmacy.status === "out_of_stock"
                      ? "Unavailable"
                      : `${pharmacy.quantity} in stock`}
                </p>
                <button
                  type="button"
                  disabled
                  className="rounded-lg bg-line px-4 py-2 text-xs font-semibold text-ink-400"
                >
                  Reserve
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-line bg-background px-6 py-10 text-center">
            <p className="font-semibold">No pharmacies match this filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
