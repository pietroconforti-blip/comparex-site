import { Link, createFileRoute } from "@tanstack/react-router";
import { SignInGate } from "@/lib/auth/gates";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Container } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";

function safeFrom(value: unknown) {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/dashboard";
  return value;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: safeFrom(search.from),
  }),
  head: () => ({ meta: [{ title: "Sign in · CompareX" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { from } = Route.useSearch();
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl font-semibold tracking-tight">Your CompareX account</h1>
        <p className="mt-3 text-muted">
          One account for saved packages, favorites and the status of provider handoffs. Signing in does not create a contract with any provider.
        </p>
        <div className="mt-8">
          <SignInGate
            fallback={
              authEnabled ? (
                <div className="flex flex-col gap-3">
                  {GROK_PROVIDERS.map((provider) => (
                    <button
                      key={provider.providerId}
                      type="button"
                      className={buttonVariants({ variant: "secondary", className: "w-full" })}
                      onClick={() => signIn(provider.providerId, { callbackURL: from })}
                    >
                      Continue with {provider.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Sign-in is not available in this build.</p>
              )
            }
          >
            <div>
              <p>You are signed in.</p>
              <Link to="/dashboard" className={buttonVariants({ variant: "navy", className: "mt-4" })}>
                Go to dashboard
              </Link>
            </div>
          </SignInGate>
        </div>
      </div>
    </Container>
  );
}
