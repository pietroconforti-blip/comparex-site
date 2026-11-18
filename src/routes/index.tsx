import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { categories, exampleQueries, getOffer, type CityId } from "@/data/catalog";
import { formatEuro } from "@/lib/money";
import { Container } from "@/components/shell";
import { addOfferToPackage } from "@/components/offers";
import { buttonVariants } from "@/components/ui/button";
import { usePackageStore } from "@/lib/package-store";

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

const cityCopy = {
  vienna: {
    name: "Vienna",
    body: "STUWO, OeAD, WIHAST and WG-Gesucht for rooms. spusu, yesss!, A1, Drei, Magenta and HoT for mobile. Wiener Linien for transport. FITINN, McFIT and USI Wien for training.",
  },
  milan: {
    name: "Milan",
    body: "Residence and rental marketplaces, Iliad, ho., Very and TIM, ATM student passes, BikeMi, and CUS Milano. Italian Spotify is not given the Austrian price.",
  },
} as const;

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const city = usePackageStore((state) => state.city);
  const setCity = usePackageStore((state) => state.setCity);

  function submit(event: FormEvent) {
    event.preventDefault();
    navigate({ to: "/search", search: { q: query.trim() } });
  }

  const cited = ["vie-wl-youth", "vie-spotify", "mil-atm-month"]
    .map((id) => getOffer(id))
    .filter((offer) => offer != null);

  return (
    <div>
      <Container className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <div>
          <p className="text-sm font-semibold text-action">One month, one desk</p>
          <h1 className="mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">
            Stack the month before you sign anything.
          </h1>
          <p className="mt-4 max-w-lg text-muted">
            Pick a city, search the real listings, and keep the total on the side. CompareX never takes the payment.
          </p>
          <form onSubmit={submit} className="mt-8 max-w-lg" role="search">
            <label className="text-sm font-medium" htmlFor="home-search">
              Ask in plain language
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Student room in Vienna under €450"
              className="mt-2 h-14 w-full rounded-md border border-line bg-wash px-4 text-base text-ink"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {exampleQueries.map((item) => (
                <Link
                  key={item}
                  to="/search"
                  search={{ q: item }}
                  className="rounded-md bg-wash px-3 py-2 text-sm text-muted hover:text-ink"
                >
                  {item}
                </Link>
              ))}
            </div>
            <button type="submit" className={buttonVariants({ variant: "primary", className: "mt-4 w-full" })}>
              Search this city
            </button>
          </form>
        </div>
        <div className="flex flex-col justify-end gap-3">
          {(Object.keys(cityCopy) as CityId[]).map((id) => (
            <article key={id} className="rounded-lg border border-line bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl">{cityCopy[id].name}</h2>
                <button
                  type="button"
                  className={buttonVariants({ variant: city === id ? "primary" : "secondary" })}
                  onClick={() => setCity(id)}
                >
                  {city === id ? "Desk city" : "Use this city"}
                </button>
              </div>
              <p className="mt-3 text-sm text-muted">{cityCopy[id].body}</p>
            </article>
          ))}
        </div>
      </Container>

      <section className="border-y border-line bg-card">
        <Container className="py-12">
          <h2 className="text-2xl">Five stacks</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category, index) => (
              <li key={category.id} className="rounded-lg border border-line bg-paper p-4">
                <p className="text-sm text-action">0{index + 1}</p>
                <h3 className="mt-1 text-xl">{category.label}</h3>
                <p className="mt-2 text-sm text-muted">{category.blurb}</p>
                <Link
                  to={categoryPath[category.id]}
                  className={buttonVariants({ variant: "secondary", className: "mt-4" })}
                >
                  Open {category.label.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="grid gap-8 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Link to="/package-builder" className={buttonVariants({ variant: "navy", className: "w-full" })}>
            Build the package first
          </Link>
          <ol className="mt-6 space-y-4 text-sm text-muted">
            <li><span className="font-semibold text-ink">Search. </span>Filters for price, data and category are applied for real.</li>
            <li><span className="font-semibold text-ink">Compare. </span>Published, reported, or no price at all.</li>
            <li><span className="font-semibold text-ink">Type your own figure. </span>When the catalog refuses to invent one.</li>
            <li><span className="font-semibold text-ink">Leave. </span>The contract stays on the provider’s site.</li>
          </ol>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {cited.map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center gap-3 py-4">
              <button type="button" className={buttonVariants({ variant: "primary" })} onClick={() => addOfferToPackage(offer)}>
                Add
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{offer.provider}</p>
                <Link to="/offers/$id" params={{ id: offer.id }} className="font-semibold hover:text-action">
                  {offer.name}
                </Link>
              </div>
              <p className="font-semibold tabular-nums">{offer.monthlyEur != null ? formatEuro(offer.monthlyEur) : "—"}</p>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
