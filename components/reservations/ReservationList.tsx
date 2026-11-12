"use client";

import { updateReservationStatus } from "@/app/actions/reservations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReservationItem = {
  id: string;
  quantity: number;
  status: string;
  created_at: string;
  expires_at: string;
  medicine: {
    id: string;
    brand_name: string;
    strength: string | null;
  };
  pharmacy: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
};

function getStatusLabel(status: string) {
  return status === "cancelled" ? "Cancelled" : status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-warning-50 text-warning-600";
    case "confirmed":
      return "bg-primary-50 text-primary-600";
    case "completed":
      return "bg-success-50 text-success-600";
    case "rejected":
      return "bg-danger-50 text-danger-600";
    default:
      return "bg-surface text-ink-600";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ReservationList({ reservations }: { reservations: ReservationItem[] }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function cancelReservation(id: string) {
    setCancellingId(id);
    setErrorMessage("");
    const result = await updateReservationStatus(id, "cancelled");
    if (result.error) {
      setErrorMessage(result.error);
      setCancellingId(null);
      return;
    }
    router.refresh();
    setCancellingId(null);
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-[14px] border border-line bg-background px-6 py-12 text-center">
        <p className="font-semibold text-ink-900">No reservations in this tab.</p>
        <p className="mt-1 text-sm text-ink-600">Your reservation history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {errorMessage ? <p role="alert" className="text-sm text-danger-600">{errorMessage}</p> : null}
      {reservations.map((reservation) => {
        const canCancel = reservation.status === "pending" || reservation.status === "confirmed";
        const canDirections = reservation.status === "confirmed" &&
          reservation.pharmacy.latitude !== null &&
          reservation.pharmacy.longitude !== null;
        const canReserveAgain = reservation.status === "completed" || reservation.status === "expired" || reservation.status === "cancelled";
        const medicineLabel = `${reservation.medicine.brand_name}${reservation.medicine.strength ? ` ${reservation.medicine.strength}` : ""}`;
        const mapUrl = canDirections
          ? `https://www.openstreetmap.org/?mlat=${reservation.pharmacy.latitude}&mlon=${reservation.pharmacy.longitude}#map=17/${reservation.pharmacy.latitude}/${reservation.pharmacy.longitude}`
          : null;

        return (
          <article key={reservation.id} className="flex flex-col gap-5 rounded-[14px] border border-line bg-background px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-medium text-ink-400">RSV-{reservation.id.slice(-4).toUpperCase()}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(reservation.status)}`}>
                  {getStatusLabel(reservation.status)}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg font-semibold text-ink-900">{medicineLabel} × {reservation.quantity}</h2>
              <p className="mt-1 text-[13px] text-ink-600">{reservation.pharmacy.name} · {reservation.pharmacy.address ?? "Address unavailable"}</p>
              <p className="mt-1 text-xs text-ink-400">
                Reserved {formatDate(reservation.created_at)}
                {reservation.status === "pending" || reservation.status === "confirmed" ? ` · Expires ${formatDate(reservation.expires_at)}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {canDirections && mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700">
                  Get directions
                </a>
              ) : null}
              {canCancel ? (
                <button type="button" onClick={() => cancelReservation(reservation.id)} disabled={cancellingId === reservation.id} className="rounded-lg border border-line bg-background px-4 py-2 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60">
                  {cancellingId === reservation.id ? "Cancelling..." : "Cancel"}
                </button>
              ) : null}
              {canReserveAgain ? (
                <Link href={`/reserve?pharmacy=${reservation.pharmacy.id}&medicine=${reservation.medicine.id}`} className="rounded-lg border border-line bg-background px-4 py-2 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-surface">
                  Reserve again
                </Link>
              ) : null}
              {reservation.status === "rejected" ? (
                <Link href={`/medicines/${reservation.medicine.id}`} className="rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700">
                  Find another pharmacy
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
