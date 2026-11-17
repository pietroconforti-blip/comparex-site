import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { addNote, getAccount, type AccountNote } from "@/lib/account.functions";
import { SignInGate } from "@/lib/auth/gates";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Container } from "@/components/shell";
import { buttonVariants, fieldClass } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact · CompareX" }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Container className="py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-3 max-w-2xl text-muted">
        There is no support inbox in this preview, and notes are not delivered to a team. If you are signed in, a note is stored on your account so you can keep a question next to your package.
      </p>
      <div className="mt-8 max-w-xl">
        <SignInGate
          fallback={
            <div>
              <p className="text-sm">Sign in to leave a note on your account.</p>
              {authEnabled ? (
                <div className="mt-4 flex flex-col gap-3">
                  {GROK_PROVIDERS.map((provider) => (
                    <button
                      key={provider.providerId}
                      type="button"
                      className={buttonVariants({ variant: "secondary" })}
                      onClick={() => signIn(provider.providerId, { callbackURL: "/contact" })}
                    >
                      Continue with {provider.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          }
        >
          <NoteBox />
        </SignInGate>
      </div>
    </Container>
  );
}

function NoteBox() {
  const { user } = useCurrentUserState();
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState<AccountNote[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    getAccount()
      .then((snap) => {
        if (!cancel) setNotes(snap.notes);
      })
      .catch(() => {
        if (!cancel) setMessage("Could not load notes.");
      });
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await addNote({ data: body }).catch(() => null);
    setSaving(false);
    if (!result || !result.ok) {
      setMessage(result && !result.ok ? result.error : "Could not save the note.");
      return;
    }
    setBody("");
    const snap = await getAccount().catch(() => null);
    if (snap) setNotes(snap.notes);
    setMessage("Stored on your account. It was not emailed.");
  }

  return (
    <div>
      <form onSubmit={(event) => void submit(event)}>
        <label className="text-sm" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          maxLength={2000}
          className={`${fieldClass} mt-1 h-auto py-3`}
        />
        <button type="submit" className={buttonVariants({ variant: "navy", className: "mt-3" })} disabled={saving}>
          {saving ? "Saving…" : "Save note"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {notes.map((note) => (
          <li key={note.id} className="py-3 text-sm">
            <p>{note.body}</p>
            <p className="mt-1 text-muted">{note.createdAt.slice(0, 10)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
