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
};

const defaultLocation = { latitude: 23.7806, longitude: 90.4075 };

export function PharmacyResults({ pharmacies }: PharmacyResultsProps) {
  const [location, setLocation] = useState(defaultLocation);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
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
          {usingDefaultLocation ? (
            <p className="mt-2 text-sm text-ink-600">Using default location</p>
          ) : (
            <p className="mt-2 text-sm text-ink-600">Sorted by distance from you</p>
          )}
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

      <div className="mt-6 grid gap-4">
        {sortedPharmacies.length > 0 ? (
          sortedPharmacies.map(({ pharmacy, distance }) => (
            <article
              key={pharmacy.id}
              className="rounded-2xl border border-line bg-background p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold">{pharmacy.name}</h3>
                    <StockBadge status={pharmacy.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{pharmacy.address ?? "Address unavailable"}</p>
                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
                    <div>
                      <dt className="inline text-ink-400">Hours: </dt>
                      <dd className="inline">{pharmacy.openingHours ?? "Hours unavailable"}</dd>
                    </div>
                    <div>
                      <dt className="inline text-ink-400">Distance: </dt>
                      <dd className="inline">
                        {distance === null ? "Unavailable" : formatDistance(distance)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex items-center justify-between gap-5 md:min-w-[180px] md:flex-col md:items-end">
                  <p className="text-sm font-semibold text-ink-600">
                    {pharmacy.quantity} available
                  </p>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg bg-line px-5 py-2.5 text-sm font-semibold text-ink-400"
                  >
                    Reserve
                  </button>
                </div>
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
