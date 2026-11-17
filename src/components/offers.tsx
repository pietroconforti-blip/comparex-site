import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategory, getOffer, type Offer } from "@/data/catalog";
import { listFavoriteIds, setFavorite } from "@/lib/account.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import { siteHost } from "@/lib/links";
import { formatEuro } from "@/lib/money";
import { usePackageStore } from "@/lib/package-store";
import { buttonVariants } from "@/components/ui/button";

export function BasisBadge({ offer }: { offer: Offer }) {
  if (!offer.basis || offer.monthlyEur == null) {
    return (
      <span className="rounded-full bg-paper px-2 py-1 text-xs font-medium text-muted">
        Price on provider
      </span>
    );
  }
  return (
    <span className="rounded-full bg-wash px-2 py-1 text-xs font-medium text-action">
      {offer.basis === "published" ? "Published figure" : "Reported figure"}
      {offer.asOf ? ` · ${offer.asOf}` : ""}
    </span>
  );
}

export function PriceBlock({ offer, emphasis = false }: { offer: Offer; emphasis?: boolean }) {
  return (
    <div className="text-right">
      {offer.monthlyEur == null ? (
        <p className={cn("font-semibold tabular-nums", emphasis ? "text-2xl" : "text-lg")}>See provider</p>
      ) : (
        <p className={cn("font-semibold tabular-nums", emphasis ? "text-3xl" : "text-lg")}>
          {formatEuro(offer.monthlyEur)}
          <span className="text-sm font-normal text-muted"> / mo</span>
        </p>
      )}
    </div>
  );
}

export function ReferenceLegend() {
  return (
    <p className="text-sm text-muted">
      Published figures come from the provider’s own page. Reported figures come from a named secondary write-up and can be out of date. If no figure is shown, CompareX is refusing to invent one — open the provider and type the real monthly cost into your package.
    </p>
  );
}

export function HandoffNote() {
  return (
    <p className="text-sm text-muted">
      Continue on the provider’s website. That opens their registration or purchase flow. CompareX does not take payment and never marks a contract as confirmed.
    </p>
  );
}

function useFavorites() {
  const { user, isPending } = useCurrentUserState();
  const [ids, setIds] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    listFavoriteIds()
      .then((rows) => {
        if (!cancel) setIds(rows);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  async function toggle(offerId: string) {
    if (!ids) return;
    const saved = !ids.includes(offerId);
    const previous = ids;
    setIds(saved ? [...ids, offerId] : ids.filter((id) => id !== offerId));
    const result = await setFavorite({ data: { offerId, saved } }).catch(() => null);
    if (!result?.ok) {
      setIds(previous);
      setFailed(true);
    }
  }

  return { isPending, signedIn: Boolean(user), ids, failed, toggle };
}

export function addOfferToPackage(offer: Offer) {
  const store = usePackageStore.getState();
  if (offer.city !== store.city) store.setCity(offer.city);
  store.pick(offer.category, { offerId: offer.id, userMonthly: null });
  store.noteRecent(offer.id);
}

export function OfferResults({
  offers,
  related = [],
  relatedTitle = "Same search, price not cited",
  note,
  empty,
}: {
  offers: Offer[];
  related?: Offer[];
  relatedTitle?: string;
  note?: string | null;
  empty: string;
}) {
  const compare = usePackageStore((state) => state.compare);
  const clearCompare = usePackageStore((state) => state.clearCompare);
  const favorites = useFavorites();
  const compared = compare.map((id) => getOffer(id)).filter((offer): offer is Offer => Boolean(offer));

  return (
    <div>
      {note ? <p className="mb-6 rounded-lg bg-wash px-4 py-3 text-sm text-ink">{note}</p> : null}
      {compared.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Comparing {compared.length}</h2>
            <button type="button" className="text-sm text-action" onClick={clearCompare}>
              Clear
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {compared.map((offer) => (
              <article key={offer.id} className="border-t border-line pt-3">
                <p className="text-sm text-muted">{offer.provider}</p>
                <h3 className="font-semibold">{offer.name}</h3>
                <div className="mt-2">
                  <PriceBlock offer={offer} />
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {offer.criteria.slice(0, 4).map((row) => (
                    <li key={row.label}>
                      <span className="text-muted">{row.label}. </span>
                      {row.value}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {offers.length === 0 ? <p className="text-muted">{empty}</p> : null}
      <ul className="divide-y divide-line border-y border-line">
        {offers.map((offer) => (
          <OfferRow key={offer.id} offer={offer} favorites={favorites} />
        ))}
      </ul>
      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{relatedTitle}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {related.map((offer) => (
              <OfferRow key={offer.id} offer={offer} favorites={favorites} />
            ))}
          </ul>
        </section>
      ) : null}
      {favorites.failed ? (
        <p className="mt-4 text-sm text-muted">Favorites could not be updated. Try again in a moment.</p>
      ) : null}
    </div>
  );
}

function OfferRow({
  offer,
  favorites,
}: {
  offer: Offer;
  favorites: ReturnType<typeof useFavorites>;
}) {
  const compare = usePackageStore((state) => state.compare);
  const toggleCompare = usePackageStore((state) => state.toggleCompare);
  const picked = usePackageStore((state) => state.picks[offer.category]?.offerId === offer.id);
  const selected = compare.includes(offer.id);

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {offer.provider}
            <span aria-hidden="true"> · </span>
            {getCategory(offer.category).label}
          </p>
          <h3 className="text-lg font-semibold tracking-tight">
            <Link to="/offers/$id" params={{ id: offer.id }} className="hover:text-action">
              {offer.name}
            </Link>
          </h3>
        </div>
        <PriceBlock offer={offer} />
      </div>
      <div className="mt-2">
        <BasisBadge offer={offer} />
      </div>
      <p className="mt-3 max-w-3xl text-sm text-muted">{offer.summary}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {offer.criteria.slice(0, 4).map((row) => (
          <div key={row.label} className="text-sm">
            <dt className="text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonVariants({ variant: picked ? "navy" : "primary" })}
          onClick={() => addOfferToPackage(offer)}
        >
          {picked ? "In your package" : "Add to package"}
        </button>
        <Link to="/offers/$id" params={{ id: offer.id }} className={buttonVariants({ variant: "secondary" })}>
          Details
        </Link>
        <button
          type="button"
          aria-pressed={selected}
          className={buttonVariants({ variant: "ghost" })}
          onClick={() => toggleCompare(offer.id)}
        >
          {selected ? "Comparing" : "Compare"}
        </button>
        <FavoriteControl offerId={offer.id} favorites={favorites} />
        <a
          href={offer.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1 px-2 text-sm text-action"
        >
          {siteHost(offer.officialUrl)}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

function FavoriteControl({
  offerId,
  favorites,
}: {
  offerId: string;
  favorites: ReturnType<typeof useFavorites>;
}) {
  if (favorites.isPending) return <span className="inline-block h-11 w-28 rounded-full bg-paper" />;
  if (!favorites.signedIn) {
    return (
      <Link to="/login" search={{ from: "/dashboard" }} className={buttonVariants({ variant: "ghost" })}>
        Sign in to save
      </Link>
    );
  }
  const saved = favorites.ids?.includes(offerId) ?? false;
  return (
    <button
      type="button"
      className={buttonVariants({ variant: "ghost" })}
      onClick={() => void favorites.toggle(offerId)}
      disabled={!favorites.ids}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
