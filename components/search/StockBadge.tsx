import type { StockStatus } from "@/lib/stock";

type StockBadgeProps = {
  status: StockStatus;
};

const stockBadgeStyles: Record<
  StockStatus,
  { className: string; label: string }
> = {
  in_stock: {
    className: "bg-success-50 text-success-600",
    label: "In stock",
  },
  low_stock: {
    className: "bg-warning-50 text-warning-600",
    label: "Low stock",
  },
  out_of_stock: {
    className: "bg-danger-50 text-danger-600",
    label: "Out of stock",
  },
};

export function StockBadge({ status }: StockBadgeProps) {
  const { className, label } = stockBadgeStyles[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
