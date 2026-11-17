import { getCategory, getOffer, type CategoryId, type Offer } from "@/data/catalog";
import { eurosToCents, sumEuros } from "@/lib/money";

export type Pick = { offerId: string; userMonthly: number | null };

export type FigureSource = "cited" | "user" | "missing";

export type PackageLine = {
  category: CategoryId;
  offer: Offer | null;
  offerId: string;
  amount: number | null;
  source: FigureSource;
};

export function lineFromPick(category: CategoryId, pick: Pick): PackageLine {
  const offer = getOffer(pick.offerId) ?? null;
  if (!offer || offer.category !== category) {
    return { category, offer: null, offerId: pick.offerId, amount: null, source: "missing" };
  }
  if (pick.userMonthly != null) {
    return { category, offer, offerId: offer.id, amount: pick.userMonthly, source: "user" };
  }
  if (offer.monthlyEur != null) {
    return { category, offer, offerId: offer.id, amount: offer.monthlyEur, source: "cited" };
  }
  return { category, offer, offerId: offer.id, amount: null, source: "missing" };
}

export function linesFromPicks(picks: Partial<Record<CategoryId, Pick>>) {
  return (Object.keys(picks) as CategoryId[])
    .filter((category) => picks[category])
    .map((category) => lineFromPick(category, picks[category]!))
    .sort((a, b) => getCategory(a.category).label.localeCompare(getCategory(b.category).label));
}

export function summarize(lines: PackageLine[], budget: number) {
  const amounts = lines.flatMap((line) => (line.amount == null ? [] : [line.amount]));
  const missing = lines.filter((line) => line.offer && line.amount == null).length;
  const broken = lines.filter((line) => !line.offer).length;
  const total = sumEuros(amounts);
  const comparable = lines.length > 0 && missing === 0 && broken === 0;
  const totalCents = eurosToCents(total);
  const budgetCents = eurosToCents(budget);
  return {
    total,
    missing,
    broken,
    count: lines.length,
    comparable,
    within: comparable && totalCents <= budgetCents,
    overBy: comparable && totalCents > budgetCents ? (totalCents - budgetCents) / 100 : null,
    left: comparable && totalCents <= budgetCents ? (budgetCents - totalCents) / 100 : null,
  };
}
