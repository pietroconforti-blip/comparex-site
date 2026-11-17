import {
  categories,
  getCity,
  isCategoryId,
  isCityId,
  offers,
  type CategoryId,
  type CityId,
  type Offer,
} from "@/data/catalog";

export type SortKey = "relevance" | "price-asc" | "price-desc";

export type ParsedQuery = {
  city: CityId | null;
  category: CategoryId | null;
  maxPrice: number | null;
  minDataGb: number | null;
  tokens: string[];
  placeNote: string | null;
};

export type SearchFilters = {
  q?: string;
  city?: string;
  category?: string;
  sort?: string;
  max?: string;
};

const SOFT = new Set([
  "a",
  "an",
  "the",
  "in",
  "for",
  "with",
  "near",
  "of",
  "and",
  "to",
  "my",
  "me",
  "on",
  "at",
  "from",
  "under",
  "below",
  "plan",
  "plans",
  "ticket",
  "tickets",
  "option",
  "options",
  "affordable",
  "cheap",
  "best",
  "good",
  "find",
  "looking",
]);

const CATEGORY_RULES: [RegExp, CategoryId][] = [
  [/\b(housing|room|rooms|apartment|flat|studio|accommodation|dorm|residence|residences|wg|wohn)\b/i, "housing"],
  [/\b(mobile|sim|tariff|tariffs|phone|gb|data)\b/i, "mobile"],
  [/\b(transport|transit|ticket|tickets|tram|metro|subway|bike|bicycle|scooter|wiener|atm)\b/i, "transport"],
  [/\b(gym|fitness|fitinn|mcfit)\b/i, "gym"],
  [/\b(stream|streaming|spotify|netflix|music|disney|prime|entertainment)\b/i, "streaming"],
];

export function parseQuery(raw: string): ParsedQuery {
  const q = raw.trim();
  let city: CityId | null = null;
  let placeNote: string | null = null;

  if (/\b(vienna|wien|fhwien|fh wien|wu|tu wien|boku|meduni|uni wien)\b/i.test(q)) {
    city = "vienna";
  }
  if (/\b(milan|milano|bocconi|politecnico|cattolica|bicocca|statale)\b/i.test(q)) {
    city = "milan";
  }
  if (/\bfh\s*wien|fhwien\b/i.test(q)) {
    placeNote = "FHWien is in Vienna. This catalog does not calculate distance to campus.";
  } else if (/\b(near|campus)\b/i.test(q) && city) {
    placeNote = `Campus names only set the city to ${getCity(city).name}. Walking distance is not calculated.`;
  }

  let category: CategoryId | null = null;
  for (const [pattern, id] of CATEGORY_RULES) {
    if (pattern.test(q)) category = id;
  }

  const price = q.match(/(?:under|below|unter|max)?\s*€\s*(\d+(?:[.,]\d+)?)|(?:under|below|unter)\s+(\d+(?:[.,]\d+)?)/i);
  const priceRaw = price?.[1] ?? price?.[2];
  const maxPrice = priceRaw ? Number(priceRaw.replace(",", ".")) : null;

  const gb = q.match(/(\d+)\s*gb/i);
  const minDataGb = gb ? Number(gb[1]) : null;

  const tokens = q
    .toLowerCase()
    .replace(/€/g, " ")
    .replace(/[^a-z0-9äöü]+/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SOFT.has(token) && !/^\d+$/.test(token));

  return {
    city,
    category,
    maxPrice: maxPrice != null && Number.isFinite(maxPrice) ? maxPrice : null,
    minDataGb,
    tokens,
    placeNote,
  };
}

function tokenHit(offer: Offer, token: string) {
  const hay = [offer.provider, offer.name, offer.summary, offer.city, offer.category, ...offer.tags]
    .join(" ")
    .toLowerCase();
  return hay.includes(token.toLowerCase());
}

function baseScore(offer: Offer, parsed: ParsedQuery) {
  let score = 0;
  if (parsed.city && offer.city === parsed.city) score += 4;
  if (parsed.category && offer.category === parsed.category) score += 4;
  for (const token of parsed.tokens) {
    if (tokenHit(offer, token)) score += 2;
  }
  if (offer.basis === "published") score += 1;
  return score;
}

export type SearchResult = {
  parsed: ParsedQuery;
  city: CityId | null;
  category: CategoryId | null;
  maxPrice: number | null;
  minDataGb: number | null;
  sort: SortKey;
  matches: Offer[];
  related: Offer[];
  note: string | null;
};

export function runSearch(filters: SearchFilters): SearchResult {
  const parsed = parseQuery(filters.q ?? "");
  const city =
    filters.city === "all" ? null : filters.city && isCityId(filters.city) ? filters.city : parsed.city;
  const category =
    filters.category === "all"
      ? null
      : filters.category && isCategoryId(filters.category)
        ? filters.category
        : parsed.category;
  const maxFromFilter = filters.max ? Number(filters.max) : null;
  const maxPrice =
    filters.max === "none"
      ? null
      : maxFromFilter != null && Number.isFinite(maxFromFilter)
        ? maxFromFilter
        : parsed.maxPrice;
  const minDataGb = parsed.minDataGb;
  const sort: SortKey =
    filters.sort === "price-asc" || filters.sort === "price-desc" || filters.sort === "relevance"
      ? filters.sort
      : parsed.tokens.length || filters.q
        ? "relevance"
        : "price-asc";

  const pool = offers.filter((offer) => {
    if (city && offer.city !== city) return false;
    if (category && offer.category !== category) return false;
    if (parsed.tokens.length && !parsed.tokens.some((token) => tokenHit(offer, token))) {
      const structured = Boolean(parsed.city || parsed.category || parsed.maxPrice || parsed.minDataGb);
      if (!structured) return false;
    }
    return true;
  });

  const matches: Offer[] = [];
  const related: Offer[] = [];
  for (const offer of pool) {
    const priceFail = maxPrice != null && (offer.monthlyEur == null || offer.monthlyEur > maxPrice);
    const dataFail = minDataGb != null && (offer.dataGb == null || offer.dataGb < minDataGb);
    if (priceFail || dataFail) related.push(offer);
    else matches.push(offer);
  }

  const sortFn = (a: Offer, b: Offer) => {
    if (sort === "price-asc" || sort === "price-desc") {
      const av = a.monthlyEur;
      const bv = b.monthlyEur;
      if (av == null && bv == null) return a.provider.localeCompare(b.provider);
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort === "price-asc" ? av - bv : bv - av;
    }
    return baseScore(b, parsed) - baseScore(a, parsed) || a.provider.localeCompare(b.provider);
  };
  matches.sort(sortFn);
  related.sort(sortFn);

  let note = parsed.placeNote;
  if (maxPrice != null && matches.length === 0 && related.length > 0) {
    note = `Nothing in the catalog has a cited monthly figure at or under €${maxPrice}. Providers below still match the search — open them and enter the real price in your package.`;
  } else if (minDataGb != null && related.length > 0) {
    const extra = `Plans without a cited data allowance of at least ${minDataGb} GB are listed separately.`;
    note = note ? `${note} ${extra}` : extra;
  }

  return { parsed, city, category, maxPrice, minDataGb, sort, matches, related, note };
}

export function categoryLabel(id: CategoryId) {
  return categories.find((category) => category.id === id)?.label ?? id;
}
