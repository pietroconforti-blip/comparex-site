import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { categories, getCategory, getCity, offersFor, type CategoryId, type CityId } from "@/data/catalog";
import { savePackage } from "@/lib/account.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatEuro, parseEuroInput } from "@/lib/money";
import { linesFromPicks, summarize } from "@/lib/package-math";
import { usePackageStore } from "@/lib/package-store";
import { BasisBadge, HandoffNote } from "@/components/offers";
import { Container } from "@/components/shell";
import { buttonVariants, fieldClass } from "@/components/ui/button";

export const Route = createFileRoute("/package-builder")({
  head: () => ({ meta: [{ title: "Package builder · CompareX" }] }),
  component: PackageBuilderPage,
});

function PackageBuilderPage() {
  const city = usePackageStore((state) => state.city);
  const setCity = usePackageStore((state) => state.setCity);
  const budget = usePackageStore((state) => state.budget);
  const setBudget = usePackageStore((state) => state.setBudget);
  const picks = usePackageStore((state) => state.picks);
  const clearPackage = usePackageStore((state) => state.clearPackage);
  const lines = linesFromPicks(picks);
  const math = summarize(lines, budget);
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("My month");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setStatus(null);
    if (lines.length === 0) {
      setStatus("Add at least one service first.");
      return;
    }
    setSaving(true);
    const result = await savePackage({
      data: {
        name,
        city,
        budget,
        items: lines.map((line) => ({
          category: line.category,
          offerId: line.offerId,
          userMonthly: line.source === "user" ? line.amount : null,
        })),
      },
    }).catch(() => null);
    setSaving(false);
    if (!result) {
      setStatus("Could not save. If you are signed out, sign in and try again.");
      return;
    }
    setStatus(result.ok ? "Saved to your account." : result.error);
  }

  return (
    <Container className="py-10">
      <p className="text-sm text-muted">Package builder</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">One month, one total.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pick a service in each category you need. Cited prices are used automatically. Everything else waits for a figure you type from the provider.
      </p>

      <p className="sticky top-16 z-30 -mx-5 mt-6 border-b border-line bg-paper px-5 py-3 text-sm lg:static lg:mx-0 lg:border-0 lg:px-0">
        <span className="font-semibold tabular-nums">{formatEuro(math.total)}</span>
        <span className="text-muted">
          {lines.length === 0
            ? ` of ${formatEuro(budget)} budget. Nothing selected.`
            : math.comparable
              ? math.within
                ? ` · ${formatEuro(math.left ?? 0)} left of ${formatEuro(budget)}.`
                : ` · ${formatEuro(math.overBy ?? 0)} over ${formatEuro(budget)}.`
              : " · add the missing monthly figures before this can be checked against your budget."}
        </span>
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              City
              <select
                value={city}
                onChange={(event) => setCity(event.target.value as CityId)}
                className={`${fieldClass} mt-1`}
              >
                <option value="vienna">Vienna</option>
                <option value="milan">Milan</option>
              </select>
            </label>
            <label className="text-sm">
              Your monthly budget
              <input
                inputMode="numeric"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                className={`${fieldClass} mt-1 tabular-nums`}
              />
            </label>
          </div>

          <div className="mt-8 space-y-10">
            {categories.map((category) => (
              <CategoryBlock key={category.id} category={category.id} city={city} />
            ))}
          </div>
        </div>

        <aside className="h-fit border-t border-line pt-5 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="text-lg font-semibold">{getCity(city).name} package</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.length === 0 ? <li className="text-muted">Nothing selected yet.</li> : null}
            {lines.map((line) => (
              <li key={line.category} className="flex justify-between gap-3">
                <span>
                  <span className="block text-muted">{getCategory(line.category).label}</span>
                  {line.offer ? line.offer.provider : "Unavailable"}
                </span>
                <span className="tabular-nums">
                  {line.amount == null ? "Needs a figure" : formatEuro(line.amount)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatEuro(math.total)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {lines.length === 0
              ? `Budget ${formatEuro(budget)}.`
              : !math.comparable
                ? `${math.missing + math.broken === 1 ? "One line still needs" : `${math.missing + math.broken} lines still need`} a real monthly figure, so this is not a full budget check.`
                : math.within
                  ? `${formatEuro(math.left ?? 0)} left inside ${formatEuro(budget)}.`
                  : `${formatEuro(math.overBy ?? 0)} over ${formatEuro(budget)}.`}
          </p>
          <div className="mt-5">
            <HandoffNote />
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/checkout" className={buttonVariants({ variant: "primary" })}>
              Review and continue
            </Link>
            {isPending ? <span className="h-11 rounded-full bg-paper" /> : null}
            {!isPending && user ? (
              <>
                <label className="sr-only" htmlFor="package-name">Package name</label>
                <input id="package-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
                <button type="button" className={buttonVariants({ variant: "secondary" })} disabled={saving} onClick={() => void save()}>
                  {saving ? "Saving…" : "Save to my account"}
                </button>
              </>
            ) : null}
            {!isPending && !user ? (
              <Link to="/login" search={{ from: "/package-builder" }} className={buttonVariants({ variant: "secondary" })}>
                Sign in to save
              </Link>
            ) : null}
            <button type="button" className={buttonVariants({ variant: "ghost" })} onClick={clearPackage}>
              Clear package
            </button>
          </div>
          {status ? <p className="mt-3 text-sm">{status}</p> : null}
        </aside>
      </div>
    </Container>
  );
}

function CategoryBlock({ category, city }: { category: CategoryId; city: CityId }) {
  const selected = usePackageStore((state) => state.picks[category]);
  const pick = usePackageStore((state) => state.pick);
  const setUserMonthly = usePackageStore((state) => state.setUserMonthly);
  const rows = offersFor(city, category);
  const meta = getCategory(category);
  const current = rows.find((offer) => offer.id === selected?.offerId);
  const [raw, setRaw] = useState(selected?.userMonthly != null ? String(selected.userMonthly) : "");

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{meta.label}</h2>
        {selected ? (
          <button type="button" className="text-sm text-action" onClick={() => pick(category, null)}>
            Remove
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
      <div className="mt-3 divide-y divide-line border-y border-line">
        {rows.map((offer) => {
          const active = selected?.offerId === offer.id;
          return (
            <label key={offer.id} className="flex cursor-pointer gap-3 py-3">
              <input
                type="radio"
                name={category}
                className="mt-1"
                checked={active}
                onChange={() => {
                  pick(category, { offerId: offer.id, userMonthly: null });
                  setRaw("");
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{offer.provider}</span>
                  <span className="text-sm tabular-nums">
                    {offer.monthlyEur == null ? "Your figure" : formatEuro(offer.monthlyEur)}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-muted">{offer.name}</span>
                <span className="mt-2 block">
                  <BasisBadge offer={offer} />
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {current ? (
        <label className="mt-3 block text-sm">
          Monthly figure you will actually pay
          <input
            inputMode="decimal"
            value={raw}
            placeholder={current.monthlyEur == null ? "Type the provider’s price" : "Leave empty to use the cited figure"}
            onChange={(event) => {
              const next = event.target.value;
              setRaw(next);
              if (!next.trim()) {
                setUserMonthly(category, null);
                return;
              }
              const parsed = parseEuroInput(next);
              if (parsed != null && !next.endsWith(".") && !next.endsWith(",")) {
                setUserMonthly(category, parsed);
              }
            }}
            onBlur={(event) => {
              const parsed = parseEuroInput(event.currentTarget.value);
              setUserMonthly(category, parsed);
              setRaw(parsed == null ? "" : String(parsed));
            }}
            className={`${fieldClass} mt-1 tabular-nums`}
          />
          <span className="mt-1 block text-muted">
            {selected?.userMonthly != null
              ? "Using your figure, not the catalog."
              : current.monthlyEur != null
                ? "Using the cited figure until you type your own."
                : "Required before the budget check can include this line."}
          </span>
        </label>
      ) : null}
    </section>
  );
}
