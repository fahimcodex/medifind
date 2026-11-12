export type StockBatch = {
  expiry_date: string | null;
  quantity: number;
  low_stock_threshold: number;
};

export type StockStatus = "out_of_stock" | "low_stock" | "in_stock";

export function getStockStatus(batches: StockBatch[]): StockStatus {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const activeBatches = batches.filter(
    (batch) => !batch.expiry_date || batch.expiry_date >= today,
  );
  const totalQuantity = activeBatches.reduce(
    (total, batch) => total + batch.quantity,
    0,
  );

  if (totalQuantity === 0) {
    return "out_of_stock";
  }

  const largestThreshold = Math.max(
    ...activeBatches.map((batch) => batch.low_stock_threshold),
  );

  return totalQuantity <= largestThreshold ? "low_stock" : "in_stock";
}
export function getTotalQuantity(batches: StockBatch[]): number {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return batches
    .filter((b) => !b.expiry_date || b.expiry_date >= today)
    .reduce((sum, b) => sum + b.quantity, 0);
}