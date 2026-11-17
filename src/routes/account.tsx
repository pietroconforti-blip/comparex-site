import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CityId } from "@/data/catalog";
import { getAccount, saveProfile, type Profile } from "@/lib/account.functions";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePackageStore } from "@/lib/package-store";
import { Container } from "@/components/shell";
import { buttonVariants, fieldClass } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account · CompareX" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const setCity = usePackageStore((state) => state.setCity);
  const setBudget = usePackageStore((state) => state.setBudget);
  const [form, setForm] = useState<Profile>({
    displayName: "",
    university: "",
    city: "vienna",
    monthlyBudget: 600,
    shareConsent: false,
  });
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    getAccount()
      .then((snap) => {
        if (cancel) return;
        setForm(
          snap.profile ?? {
            displayName: user.displayName ?? "",
            university: "",
            city: "vienna",
            monthlyBudget: 600,
            shareConsent: false,
          },
        );
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setMessage("Could not load your profile.");
      });
    return () => {
      cancel = true;
    };
  }, [user?.id, user?.displayName]);

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="h-8 w-40 animate-pulse rounded-md bg-card" />
      </Container>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await saveProfile({ data: form }).catch(() => null);
    setSaving(false);
    if (!result) {
      setMessage("Could not save.");
      return;
    }
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setForm(result.profile);
    setCity(result.profile.city);
    setBudget(result.profile.monthlyBudget);
    setMessage("Saved. Your city and budget were also applied to the package on this device.");
  }

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Account</h1>
          <p className="mt-2 text-sm text-muted">{user.primaryEmail}</p>
        </div>
        <UserButton />
      </div>
      <form onSubmit={(event) => void save(event)} className="mt-8 max-w-xl space-y-4">
        <label className="block text-sm">
          Name on CompareX
          <input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            className={`${fieldClass} mt-1`}
            maxLength={80}
          />
        </label>
        <label className="block text-sm">
          University
          <input
            value={form.university}
            onChange={(event) => setForm({ ...form, university: event.target.value })}
            className={`${fieldClass} mt-1`}
            maxLength={120}
          />
        </label>
        <label className="block text-sm">
          City
          <select
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value as CityId })}
            className={`${fieldClass} mt-1`}
          >
            <option value="vienna">Vienna</option>
            <option value="milan">Milan</option>
          </select>
        </label>
        <label className="block text-sm">
          Monthly budget
          <input
            inputMode="numeric"
            value={form.monthlyBudget}
            onChange={(event) => setForm({ ...form, monthlyBudget: Number(event.target.value) })}
            className={`${fieldClass} mt-1 tabular-nums`}
          />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.shareConsent}
            onChange={(event) => setForm({ ...form, shareConsent: event.target.checked })}
          />
          <span>
            If a provider integration is approved later, CompareX may share my name, email and chosen offer with that provider. No integration is active, so this preference is stored and not sent anywhere.
          </span>
        </label>
        <button type="submit" className={buttonVariants({ variant: "navy" })} disabled={saving || !ready}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
      <p className="mt-8 text-sm">
        <Link to="/privacy" className="text-action">Read what is stored</Link>
      </p>
    </Container>
  );
}
