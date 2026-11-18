import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { categories, exampleQueries, getOffer } from "@/data/catalog";
import { formatEuro } from "@/lib/money";
import { Container } from "@/components/shell";
import { addOfferToPackage } from "@/components/offers";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

const categoryPath = {
  housing: "/housing",
  mobile: "/mobile",
  transport: "/transport",
  gym: "/gym",
  streaming: "/streaming",
} as const;

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    navigate({ to: "/search", search: { q: query.trim() } });
  }

  const cited = ["vie-wl-youth", "vie-spotify", "mil-atm-month"]
    .map((id) => getOffer(id))
    .filter((offer) => offer != null);

  return (
    <div>
      <section className="border-b border-line bg-card">
        <Container className="py-14 sm:py-20">
          <p className="text-sm font-semibold text-action">Vienna and Milan</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-6xl">
            Everything students need. One platform.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Search housing, mobile, transport, gyms and streaming. Build one monthly package. Continue on the provider’s own site.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" role="search">
            <label className="sr-only" htmlFor="home-search">
              Search services
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Student room in Vienna under €450"
              className="h-14 flex-1 rounded-lg border border-line bg-paper px-4 text-base text-ink"
            />
            <button type="submit" className={buttonVariants({ variant: "primary", className: "h-14 px-6" })}>
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {exampleQueries.map((item) => (
              <Link
                key={item}
                to="/search"
                search={{ q: item }}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink hover:border-action"
              >
                {item}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <h2 className="text-2xl">Five services, one account</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {categories.map((category) => (
            <div key={category.id} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
              <dt className="font-semibold">{category.label}</dt>
              <dd className="text-muted">{category.blurb}</dd>
              <dd>
                <Link to={categoryPath[category.id]} className="text-sm font-medium text-action">
                  Open {category.label.toLowerCase()}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Container>

      <section className="border-y border-line bg-card">
        <Container className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl">Figures we can actually cite</h2>
            <p className="mt-3 text-muted">
              These are not a basket you can buy from CompareX. They are public or reported numbers you can drop into a package, then check on the provider before you pay.
            </p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {cited.map((offer) => (
                <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm text-muted">{offer.provider}</p>
                    <Link to="/offers/$id" params={{ id: offer.id }} className="font-semibold hover:text-action">
                      {offer.name}
                    </Link>
                    <p className="text-sm text-muted">{offer.basis === "published" ? "Published" : "Reported"} · {offer.asOf}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{offer.monthlyEur != null ? formatEuro(offer.monthlyEur) : "—"}</p>
                    <button type="button" className="text-sm text-action" onClick={() => addOfferToPackage(offer)}>
                      Add to package
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl">How a month gets organised</h2>
            <ol className="mt-6 space-y-5">
              <li>
                <p className="font-semibold">1. Search the city</p>
                <p className="text-sm text-muted">Ask in plain language. Filters for price, data and category are applied for real.</p>
              </li>
              <li>
                <p className="font-semibold">2. Compare the conditions</p>
                <p className="text-sm text-muted">See what is published, what is only reported, and what we refuse to price.</p>
              </li>
              <li>
                <p className="font-semibold">3. Build the package</p>
                <p className="text-sm text-muted">Set a budget. Type your own rent or tariff when the catalog has no honest number.</p>
              </li>
              <li>
                <p className="font-semibold">4. Continue with the provider</p>
                <p className="text-sm text-muted">Registration, the contract and payment stay on their site. Nothing here is a confirmation.</p>
              </li>
            </ol>
            <Link to="/package-builder" className={buttonVariants({ variant: "navy", className: "mt-8" })}>
              Build your package
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <h2 className="text-2xl">Two cities, one site</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <article>
            <h3 className="text-xl font-semibold">Vienna</h3>
            <p className="mt-2 text-muted">
              STUWO, OeAD, WIHAST and WG-Gesucht for rooms. spusu, yesss!, A1, Drei, Magenta and HoT for mobile. Wiener Linien for transport. FITINN, McFIT and USI Wien for training.
            </p>
          </article>
          <article>
            <h3 className="text-xl font-semibold">Milan</h3>
            <p className="mt-2 text-muted">
              Residence and rental marketplaces, Iliad, ho., Very and TIM, ATM student passes, BikeMi, and CUS Milano. Italian Spotify is not given the Austrian price.
            </p>
          </article>
        </div>
      </Container>
    </div>
  );
}
