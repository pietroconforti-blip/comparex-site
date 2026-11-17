import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { categories, cities } from "@/data/catalog";
import { runSearch } from "@/lib/search";
import { Container } from "@/components/shell";
import { OfferResults, ReferenceLegend } from "@/components/offers";
import { buttonVariants, fieldClass } from "@/components/ui/button";

type SearchParams = {
  q?: string;
  city?: string;
  category?: string;
  sort?: string;
  max?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    city: typeof search.city === "string" ? search.city : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    max: typeof search.max === "string" ? search.max : undefined,
  }),
  head: () => ({ meta: [{ title: "Search · CompareX" }] }),
  component: SearchPage,
});

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState(params.q ?? "");
  const result = runSearch(params);

  function submit(event: FormEvent) {
    event.preventDefault();
    navigate({ search: { ...params, q: draft } });
  }

  function setFilter(patch: SearchParams) {
    navigate({ search: { ...params, ...patch } });
  }

  return (
    <Container className="py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Search</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Try a city, a service and a limit. “Mobile plan with 100 GB” keeps plans whose cited data is at least 100 GB.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input id="q" value={draft} onChange={(event) => setDraft(event.target.value)} className={fieldClass} />
        <button type="submit" className={buttonVariants({ variant: "navy" })}>
          Search
        </button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <select
          aria-label="City filter"
          value={params.city ?? ""}
          onChange={(event) => setFilter({ city: event.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">City from the search</option>
          <option value="all">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Category filter"
          value={params.category ?? ""}
          onChange={(event) => setFilter({ category: event.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">Category from the search</option>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={params.sort ?? result.sort}
          onChange={(event) => setFilter({ sort: event.target.value })}
          className={fieldClass}
        >
          <option value="relevance">Best match</option>
          <option value="price-asc">Lowest cited price</option>
          <option value="price-desc">Highest cited price</option>
        </select>
        <input
          aria-label="Maximum monthly price"
          inputMode="decimal"
          placeholder="Max € / month"
          defaultValue={params.max && params.max !== "none" ? params.max : ""}
          key={params.max ?? "max"}
          onBlur={(event) => {
            const value = event.target.value.trim();
            setFilter({ max: value ? value : "none" });
          }}
          className={fieldClass}
        />
      </div>
      <p className="mt-4 text-sm text-muted">
        Showing {result.matches.length} match{result.matches.length === 1 ? "" : "es"}
        {result.city ? ` in ${result.city === "vienna" ? "Vienna" : "Milan"}` : ""}
        {result.category ? ` · ${result.category}` : ""}
        {result.maxPrice != null ? ` · at or under €${result.maxPrice}` : ""}
        {result.minDataGb != null ? ` · ${result.minDataGb} GB or more` : ""}.
      </p>
      <div className="mt-3 max-w-3xl">
        <ReferenceLegend />
      </div>
      <div className="mt-8">
        <OfferResults
          offers={result.matches}
          related={result.related}
          note={result.note}
          empty="Nothing matched. Try a provider name, or clear the price cap."
        />
      </div>
    </Container>
  );
}
