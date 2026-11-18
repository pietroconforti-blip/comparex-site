import { useMemo, useState } from "react";
import { getCategory, getCity, offersFor, type CategoryId } from "@/data/catalog";
import { type SortKey } from "@/lib/search";
import { usePackageStore } from "@/lib/package-store";
import { Container } from "@/components/shell";
import { OfferResults, ReferenceLegend } from "@/components/offers";
import { fieldClass } from "@/components/ui/button";

export function CategoryScreen({ category }: { category: CategoryId }) {
  const city = usePackageStore((state) => state.city);
  const meta = getCategory(category);
  const place = getCity(city);
  const [sort, setSort] = useState<SortKey>("price-asc");
  const [text, setText] = useState("");

  const offers = useMemo(() => {
    const query = text.trim().toLowerCase();
    const list = offersFor(city, category).filter((offer) => {
      if (!query) return true;
      return [offer.provider, offer.name, offer.summary, ...offer.tags].join(" ").toLowerCase().includes(query);
    });
    return [...list].sort((a, b) => {
      if (sort === "relevance") return a.provider.localeCompare(b.provider);
      const av = a.monthlyEur;
      const bv = b.monthlyEur;
      if (av == null && bv == null) return a.provider.localeCompare(b.provider);
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort === "price-asc" ? av - bv : bv - av;
    });
  }, [category, city, sort, text]);

  return (
    <Container className="py-10">
      <p className="text-sm font-medium text-action">
        {place.name}, {place.country}
      </p>
      <h1 className="mt-2 text-4xl">{meta.label}</h1>
      <p className="mt-3 max-w-2xl text-muted">{meta.blurb}. Change city in the header to switch between Vienna and Milan.</p>
      <div className="mt-4 max-w-3xl">
        <ReferenceLegend />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="filter-text">
          Filter providers
        </label>
        <input
          id="filter-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Filter by provider or keyword"
          className={fieldClass}
        />
        <label className="sr-only" htmlFor="filter-sort">
          Sort
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className={fieldClass}
        >
          <option value="price-asc">Lowest cited price</option>
          <option value="price-desc">Highest cited price</option>
          <option value="relevance">Provider name</option>
        </select>
      </div>
      <div className="mt-8">
        <OfferResults
          offers={offers}
          empty={`No ${meta.label.toLowerCase()} rows in ${place.name} match that filter.`}
        />
      </div>
    </Container>
  );
}
