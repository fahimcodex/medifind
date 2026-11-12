"use client";

import { createReservation } from "@/app/actions/reservations";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ReserveFormProps = {
  pharmacyId: string;
  medicineId: string;
  availableQuantity: number;
};

export function ReserveForm({ pharmacyId, medicineId, availableQuantity }: ReserveFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    if (!termsAccepted) {
      setErrorMessage("Please accept the reservation terms.");
      return;
    }

    setIsSubmitting(true);
    const result = await createReservation(pharmacyId, medicineId, quantity);
    if (result.error) {
      setErrorMessage(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push("/reservations");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="rounded-[14px] border border-line bg-background p-6">
        <h2 className="text-base font-bold">Quantity</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex overflow-hidden rounded-[10px] border border-line">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex size-11 items-center justify-center text-lg text-ink-900 disabled:text-ink-400" aria-label="Decrease quantity">−</button>
            <span className="flex h-11 w-16 items-center justify-center bg-surface font-semibold">{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => Math.min(availableQuantity, value + 1))} disabled={quantity >= availableQuantity} className="flex size-11 items-center justify-center text-lg text-ink-900 disabled:text-ink-400" aria-label="Increase quantity">+</button>
          </div>
          <p className="text-[13px] font-medium text-ink-600">{availableQuantity} available at this pharmacy</p>
        </div>
        <p className="mt-3 text-xs text-ink-400">You can reserve up to the available quantity.</p>
      </section>

      <label className="flex items-start gap-2 text-[13px] text-ink-600">
        <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 size-4 accent-primary-600" />
        <span>I understand availability may change until the pharmacy confirms my reservation.</span>
      </label>
      {errorMessage ? <p role="alert" className="text-sm text-danger-600">{errorMessage}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting || availableQuantity < 1} className="rounded-lg bg-primary-600 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Reserving..." : "Confirm reservation"}
        </button>
        <button type="button" onClick={() => router.push(`/medicines/${medicineId}`)} className="rounded-lg border border-line bg-background px-7 py-3 text-[15px] font-semibold text-ink-900">Cancel</button>
      </div>
    </form>
  );
}
