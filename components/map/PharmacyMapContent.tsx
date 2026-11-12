"use client";

import { formatDistance, haversineKm } from "@/lib/geo";
import type { PharmacyResult } from "@/components/medicine/PharmacyResults";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

type PharmacyMapContentProps = {
  pharmacies: PharmacyResult[];
  selectedPharmacyId: string | null;
};

const defaultLocation = { latitude: 23.7806, longitude: 90.4075 };

const statusLabels = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
} as const;

const markerColors = {
  in_stock: "#12996B",
  low_stock: "#B54708",
  out_of_stock: "#B42318",
} as const;

function createDotIcon(color: string, selected = false) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 ${selected ? 4 : 1}px ${selected ? "rgba(29,111,224,.35)" : "rgba(16,24,40,.35)"}"></span>`,
    iconSize: [selected ? 22 : 16, selected ? 22 : 16],
    iconAnchor: [selected ? 11 : 8, selected ? 11 : 8],
  });
}

const userIcon = createDotIcon("#1D6FE0");

export default function PharmacyMapContent({
  pharmacies,
  selectedPharmacyId,
}: PharmacyMapContentProps) {
  const [location, setLocation] = useState(defaultLocation);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  }, []);

  const mappedPharmacies = useMemo(
    () =>
      pharmacies.filter(
        (pharmacy) => pharmacy.latitude !== null && pharmacy.longitude !== null,
      ),
    [pharmacies],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-background">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={12}
        scrollWheelZoom
        className="h-[700px] w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.latitude, location.longitude]} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>
        {mappedPharmacies.map((pharmacy) => {
          const distance = haversineKm(
            location.latitude,
            location.longitude,
            pharmacy.latitude!,
            pharmacy.longitude!,
          );

          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.latitude!, pharmacy.longitude!]}
              icon={createDotIcon(
                markerColors[pharmacy.status],
                pharmacy.id === selectedPharmacyId,
              )}
            >
              <Popup>
                <strong>{pharmacy.name}</strong>
                <br />
                Status: {statusLabels[pharmacy.status]}
                <br />
                Distance: {formatDistance(distance)}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
