import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cities, type CityId } from "@/data/catalog";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import { useHydratePackage, usePackageStore } from "@/lib/package-store";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { to: "/housing", label: "Housing" },
  { to: "/mobile", label: "Mobile" },
  { to: "/transport", label: "Transport" },
  { to: "/gym", label: "Gym" },
  { to: "/streaming", label: "Streaming" },
] as const;

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-5xl px-5", className)}>{children}</div>;
}

function AuthLink({ block = false }: { block?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <span className={cn("inline-block h-11 animate-pulse rounded-md bg-wash", block ? "w-full" : "w-24")} />;
  if (!user) {
    return (
      <Link
        to="/login"
        search={{ from: "/dashboard" }}
        className={buttonVariants({ variant: "secondary", className: block ? "w-full" : undefined })}
      >
        Sign in
      </Link>
    );
  }
  return (
    <Link
      to="/dashboard"
      className={buttonVariants({ variant: "ghost", className: block ? "w-full" : undefined })}
    >
      Account
    </Link>
  );
}

function CitySelect({ id }: { id: string }) {
  const city = usePackageStore((state) => state.city);
  const setCity = usePackageStore((state) => state.setCity);
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        City
      </label>
      <select
        id={id}
        value={city}
        onChange={(event) => setCity(event.target.value as CityId)}
        className="h-11 w-full rounded-md border border-line bg-wash px-3 text-sm text-ink"
      >
        {cities.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  useHydratePackage();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Rail />
      <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
        <MobileBar />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Dock />
    </div>
  );
}

function Rail() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-card px-4 py-6 lg:flex">
      <Link to="/" className="text-xl font-semibold tracking-tight">
        CompareX
      </Link>
      <p className="mt-1 text-sm text-muted">Monthly desk</p>
      <div className="mt-6">
        <CitySelect id="rail-city" />
      </div>
      <nav className="mt-6 flex flex-col gap-1" aria-label="Categories">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-11 items-center rounded-md px-3 text-sm font-medium",
              pathname === item.to ? "bg-wash text-action" : "text-muted hover:bg-wash hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <Link to="/search" className={buttonVariants({ variant: "primary", className: "w-full" })}>
          Search
        </Link>
        <Link to="/package-builder" className={buttonVariants({ variant: "navy", className: "w-full" })}>
          Open package
        </Link>
        <AuthLink block />
      </div>
    </aside>
  );
}

function MobileBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card lg:hidden">
      <div className="flex h-16 items-center gap-3 px-5">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          CompareX
        </Link>
        <button
          type="button"
          className="ml-auto grid h-11 w-11 place-items-center rounded-md border border-line"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line px-5 py-4">
          <CitySelect id="mobile-city" />
          <nav className="mt-3 flex flex-col" aria-label="Categories">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="flex h-11 items-center text-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Dock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-card lg:hidden"
      aria-label="Actions"
    >
      <Link
        to="/search"
        className={cn(
          "flex h-16 items-center justify-center text-sm font-semibold",
          pathname === "/search" ? "text-action" : "text-muted",
        )}
      >
        Search
      </Link>
      <Link
        to="/package-builder"
        className="flex h-16 items-center justify-center bg-action text-sm font-semibold text-ink"
      >
        Package
      </Link>
      <DockAccount />
    </nav>
  );
}

function DockAccount() {
  const { user } = useCurrentUserState();
  if (user) {
    return (
      <Link to="/dashboard" className="flex h-16 items-center justify-center text-sm font-semibold text-muted">
        Account
      </Link>
    );
  }
  return (
    <Link
      to="/login"
      search={{ from: "/dashboard" }}
      className="flex h-16 items-center justify-center text-sm font-semibold text-muted"
    >
      Sign in
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-line">
      <Container className="grid gap-6 py-10 sm:grid-cols-3">
        <p className="text-sm text-muted">
          CompareX is a desk for one student month. It compares and refers. It does not sell the services.
        </p>
        <ul className="space-y-2 text-sm">
          <li><Link to="/privacy" className="text-muted hover:text-ink">Privacy</Link></li>
          <li><Link to="/contact" className="text-muted hover:text-ink">Contact</Link></li>
        </ul>
        <p className="text-sm text-muted">
          A contract exists only if you finish it on the provider’s own site.
        </p>
      </Container>
    </footer>
  );
}
