import Link from "next/link";

type MedicineCardProps = {
  id: string;
  brandName: string;
  genericName: string;
  strength: string | null;
  form: string | null;
  category: string | null;
  pharmacyCount: number;
  stockCount: number;
};

export function MedicineCard({
  id,
  brandName,
  genericName,
  strength,
  form,
  category,
  pharmacyCount,
  stockCount,
}: MedicineCardProps) {
  return (
    <article className="rounded-[14px] border border-line bg-background p-6 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="truncate text-[22px] font-bold text-ink-900">{brandName}</h2>
            {strength ? <span className="text-sm font-medium text-ink-400">{strength}</span> : null}
          </div>
          <p className="text-sm text-ink-600">Generic: {genericName}</p>
          <div className="flex flex-wrap gap-2">
            {form ? <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600">{form}</span> : null}
            {category ? <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-600">{category}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
          <p className="text-[13px] font-medium text-ink-600">
            {pharmacyCount} pharmacies · {stockCount} with stock
          </p>
          <Link href={`/medicines/${id}`} className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-primary-700">
            View availability →
          </Link>
        </div>
      </div>
    </article>
  );
}
