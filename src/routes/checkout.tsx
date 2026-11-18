import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getCategory, getCity } from "@/data/catalog";
import { markHandoff } from "@/lib/account.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { siteHost } from "@/lib/links";
import { formatEuro } from "@/lib/money";
import { linesFromPicks, summarize } from "@/lib/package-math";
import { usePackageStore } from "@/lib/package-store";
import { HandoffNote } from "@/components/offers";
import { Container } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Review · CompareX" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const city = usePackageStore((state) => state.city);
  const budget = usePackageStore((state) => state.budget);
  const picks = usePackageStore((state) => state.picks);
  const handoffs = usePackageStore((state) => state.handoffs);
  const markLocal = usePackageStore((state) => state.markHandoff);
  const lines = linesFromPicks(picks).filter((line) => line.offer);
  const math = summarize(lines, budget);
  const { user } = useCurrentUserState();

  return (
    <Container className="py-10">
      <p className="text-sm text-muted">Review</p>
      <h1 className="mt-2 text-5xl">Continue with each provider.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {getCity(city).name}. CompareX does not check you out, take a card, or tell a provider you have signed. Each button leaves this site.
      </p>
      {lines.length === 0 ? (
        <div className="mt-8">
          <p>Your package is empty.</p>
          <Link to="/package-builder" className={buttonVariants({ variant: "navy", className: "mt-4" })}>
            Build a package
          </Link>
        </div>
      ) : (
        <div className="mt-8 max-w-3xl">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => {
              const offer = line.offer!;
              const opened = handoffs.includes(offer.id);
              return (
                <li key={line.category} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">{getCategory(line.category).label}</p>
                      <h2 className="text-lg font-semibold">{offer.provider}</h2>
                      <p className="text-sm text-muted">{offer.name}</p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {line.amount == null ? "No figure yet" : formatEuro(line.amount)}
                      {line.source === "user" ? <span className="block text-xs font-normal text-muted">Your figure</span> : null}
                      {line.source === "cited" ? <span className="block text-xs font-normal text-muted">Cited figure</span> : null}
                    </p>
                  </div>
                  <p className="mt-3 text-sm">
                    {opened
                      ? "Provider site opened on this device. This is not a contract and not a confirmation."
                      : "Not started."}
                  </p>
                  <a
                    href={offer.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "primary", className: "mt-3" })}
                    onClick={() => {
                      markLocal(offer.id);
                      if (user) void markHandoff({ data: offer.id }).catch(() => undefined);
                    }}
                  >
                    Continue on {siteHost(offer.officialUrl)}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-2xl font-semibold tabular-nums">{formatEuro(math.total)}</p>
          <p className="mt-1 text-sm text-muted">
            {math.comparable
              ? math.within
                ? `Inside your ${formatEuro(budget)} budget.`
                : `${formatEuro(math.overBy ?? 0)} over your ${formatEuro(budget)} budget.`
              : "The total only adds lines that have a figure. It is not a quote."}
          </p>
          <div className="mt-4">
            <HandoffNote />
          </div>
          <Link to="/package-builder" className="mt-4 inline-block text-sm text-action">
            Edit package
          </Link>
        </div>
      )}
    </Container>
  );
}
