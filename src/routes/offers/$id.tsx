import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getCity, getOffer } from "@/data/catalog";
import { siteHost } from "@/lib/links";
import { Container } from "@/components/shell";
import { BasisBadge, HandoffNote, PriceBlock, addOfferToPackage } from "@/components/offers";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/offers/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${getOffer(params.id)?.name ?? "Offer"} · CompareX` }],
  }),
  component: OfferPage,
});

function OfferPage() {
  const { id } = Route.useParams();
  const offer = getOffer(id);

  if (!offer) {
    return (
      <Container className="py-16">
        <h1 className="text-3xl font-semibold">This offer is not in the catalog</h1>
        <p className="mt-3 text-muted">It may have been removed from the reference list.</p>
        <Link to="/search" className={buttonVariants({ variant: "navy", className: "mt-6" })}>
          Back to search
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <p className="text-sm text-muted">
        <Link to="/search" className="hover:text-ink">Search</Link>
        <span aria-hidden="true"> / </span>
        {getCity(offer.city).name}
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{offer.provider}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{offer.name}</h1>
        </div>
        <PriceBlock offer={offer} emphasis />
      </div>
      <div className="mt-3">
        <BasisBadge offer={offer} />
      </div>
      <p className="mt-6 max-w-3xl text-lg">{offer.summary}</p>
      <p className="mt-4 max-w-3xl text-sm text-muted">{offer.priceDetail}</p>
      {offer.sourceLabel ? (
        <p className="mt-2 text-sm text-muted">Source: {offer.sourceLabel}.</p>
      ) : null}
      <dl className="mt-8 max-w-3xl divide-y divide-line border-y border-line">
        {offer.criteria.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 max-w-3xl">
        <HandoffNote />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className={buttonVariants({ variant: "primary" })} onClick={() => addOfferToPackage(offer)}>
          Add to package
        </button>
        <Link to="/package-builder" className={buttonVariants({ variant: "secondary" })}>
          Open package builder
        </Link>
        <a
          href={offer.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "navy" })}
        >
          Continue on {siteHost(offer.officialUrl)}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </Container>
  );
}
