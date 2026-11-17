export function eurosToCents(n: number) {
  return Math.round(n * 100);
}

export function formatEuro(n: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function sumEuros(values: number[]) {
  const cents = values.reduce((sum, n) => sum + eurosToCents(n), 0);
  return cents / 100;
}

export function parseEuroInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 20000) return null;
  return Math.round(value * 100) / 100;
}

export function clampBudget(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(20000, Math.max(0, Math.round(n)));
}
