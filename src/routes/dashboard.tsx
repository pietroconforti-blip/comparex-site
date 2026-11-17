import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCategory, getOffer } from "@/data/catalog";
import { deletePackage, getAccount, type AccountSnapshot, type SavedPackage } from "@/lib/account.functions";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatEuro } from "@/lib/money";
import { linesFromPicks, summarize, type Pick } from "@/lib/package-math";
import { usePackageStore } from "@/lib/package-store";
import { Container } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CompareX" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isPending } = useCurrentUserState();
  const [snap, setSnap] = useState<AccountSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recent = usePackageStore((state) => state.recent);
  const picks = usePackageStore((state) => state.picks);
  const budget = usePackageStore((state) => state.budget);
  const city = usePackageStore((state) => state.city);
  const replaceAll = usePackageStore((state) => state.replaceAll);
  const working = summarize(linesFromPicks(picks), budget);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    getAccount()
      .then((next) => {
        if (!cancel) setSnap(next);
      })
      .catch(() => {
        if (!cancel) setError("Your account could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="h-8 w-48 animate-pulse rounded-md bg-card" />
        <div className="mt-6 h-32 animate-pulse rounded-md bg-card" />
      </Container>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const name = snap?.profile?.displayName || user.displayName || "there";

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Dashboard</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Hello, {name}</h1>
        </div>
        <UserButton />
      </div>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Saved offers, handoffs you started, and packages on your account. A handoff means you opened the provider. It is never a confirmed contract.
      </p>
      {error ? <p className="mt-4 text-sm">{error}</p> : null}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">On this device</h2>
        <p className="mt-1 text-sm text-muted">
          Working package for {city === "vienna" ? "Vienna" : "Milan"} · {formatEuro(working.total)}
          {working.comparable ? (working.within ? " inside budget" : " over budget") : ""}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/package-builder" className={buttonVariants({ variant: "navy" })}>
            Edit package
          </Link>
          <Link to="/checkout" className={buttonVariants({ variant: "secondary" })}>
            Review providers
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Saved packages</h2>
        {!snap ? <p className="mt-3 text-sm text-muted">Loading your packages…</p> : null}
        {snap && snap.packages.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None yet. Build a package and save it from the builder.</p>
        ) : null}
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {snap?.packages.map((item) => (
            <PackageRow
              key={item.id}
              item={item}
              onOpen={() => {
                const picksNext: Partial<Record<string, Pick>> = {};
                for (const row of item.items) {
                  picksNext[row.category] = { offerId: row.offerId, userMonthly: row.userMonthly };
                }
                replaceAll({
                  city: item.city,
                  budget: item.budget,
                  picks: picksNext as Partial<Record<import("@/data/catalog").CategoryId, Pick>>,
                });
              }}
              onDelete={async () => {
                await deletePackage({ data: item.id });
                setSnap(await getAccount());
              }}
            />
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Favorites</h2>
        {snap && snap.favoriteIds.length === 0 ? <p className="mt-3 text-sm text-muted">No favorites yet.</p> : null}
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {snap?.favoriteIds.map((id) => {
            const offer = getOffer(id);
            return (
              <li key={id} className="flex items-center justify-between gap-3 py-3 text-sm">
                {offer ? (
                  <Link to="/offers/$id" params={{ id }} className="font-medium hover:text-action">
                    {offer.provider} · {offer.name}
                  </Link>
                ) : (
                  <span>Removed from the catalog</span>
                )}
                <span className="text-muted">{offer ? getCategory(offer.category).label : ""}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Provider handoffs</h2>
        <p className="mt-1 text-sm text-muted">
          Statuses stop at “handoff started”. CompareX has no provider webhook, so nothing here can become confirmed.
        </p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {(snap?.statuses ?? [])
            .filter((row) => row.status === "handoff")
            .map((row) => {
              const offer = getOffer(row.offerId);
              return (
                <li key={row.offerId} className="py-3 text-sm">
                  <p className="font-medium">{offer ? `${offer.provider} · ${offer.name}` : row.offerId}</p>
                  <p className="text-muted">Handoff started · not confirmed by the provider</p>
                </li>
              );
            })}
        </ul>
        {snap && snap.statuses.every((row) => row.status !== "handoff") ? (
          <p className="mt-3 text-sm text-muted">You have not opened a provider from a saved flow yet.</p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Recently viewed</h2>
        {recent.length === 0 ? <p className="mt-3 text-sm text-muted">Offers you open will show up here on this device.</p> : null}
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {recent.map((id) => {
            const offer = getOffer(id);
            if (!offer) return null;
            return (
              <li key={id} className="py-3 text-sm">
                <Link to="/offers/$id" params={{ id }} className="hover:text-action">
                  {offer.provider} · {offer.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link to="/account" className="text-action">Account and privacy settings</Link>
      </p>
    </Container>
  );
}

function PackageRow({
  item,
  onOpen,
  onDelete,
}: {
  item: SavedPackage;
  onOpen: () => void;
  onDelete: () => Promise<void>;
}) {
  const picks = Object.fromEntries(
    item.items.map((row) => [row.category, { offerId: row.offerId, userMonthly: row.userMonthly }]),
  ) as Partial<Record<import("@/data/catalog").CategoryId, Pick>>;
  const math = summarize(linesFromPicks(picks), item.budget);
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted">
          {item.city === "vienna" ? "Vienna" : "Milan"} · {item.items.length} services · {formatEuro(math.total)} of {formatEuro(item.budget)}
        </p>
      </div>
      <div className="flex gap-2">
        <Link to="/package-builder" className={buttonVariants({ variant: "secondary" })} onClick={onOpen}>
          Open
        </Link>
        <button
          type="button"
          className={buttonVariants({ variant: "ghost" })}
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onDelete().finally(() => setBusy(false));
          }}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
