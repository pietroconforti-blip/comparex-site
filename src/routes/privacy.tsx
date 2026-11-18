import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy · CompareX" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Container className="py-10">
      <h1 className="text-5xl">Privacy</h1>
      <div className="mt-6 max-w-2xl space-y-4 text-sm">
        <p>
          CompareX in this preview stores an account only so you can keep a profile, saved packages, favorites, handoff notes and messages you write yourself. Each of those rows is read and written for the signed-in user only.
        </p>
        <p>
          The catalog of providers is the same for everyone. It is reference information, not a file about you. Prices marked published or reported are descriptions of public pages, not a claim that a provider shared data with CompareX.
        </p>
        <p>
          The working package, recently viewed offers and “site opened” marks also live in this browser until you save a package or open a provider while signed in. Saving copies the package onto your account. Opening a provider records a handoff. It does not record a contract, because no provider confirms one.
        </p>
        <p>
          CompareX does not take card payments and does not ask for a provider password. The optional sharing preference on your account is stored only. Nothing is sent to a provider, because no integration is connected.
        </p>
        <p>
          This page is product information for the preview. It is not a substitute for legal advice, and it does not mean an Austrian business has been registered.
        </p>
      </div>
    </Container>
  );
}
