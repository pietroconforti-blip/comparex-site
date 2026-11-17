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
  { to: "/package-builder", label: "Package" },
] as const;

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5", className)}>{children}</div>;
}

function AuthLink() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <span className="inline-block h-11 w-24 animate-pulse rounded-full bg-paper" />;
  if (!user) {
    return (
      <Link to="/login" search={{ from: "/dashboard" }} className={buttonVariants({ variant: "navy" })}>
        Sign in
      </Link>
    );
  }
  return (
    <Link to="/dashboard" className={buttonVariants({ variant: "secondary" })}>
      Account
    </Link>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  useHydratePackage();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const city = usePackageStore((state) => state.city);
  const setCity = usePackageStore((state) => state.setCity);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <Container className="flex h-16 items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-navy">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-navy text-xs text-paper">Cx</span>
          CompareX
        </Link>
        <nav className="ml-4 hidden items-center gap-4 xl:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-sm",
                pathname === item.to ? "font-semibold text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/search" className="hidden text-sm text-muted hover:text-ink sm:inline">
            Search
          </Link>
          <label className="sr-only" htmlFor="header-city">
            City
          </label>
          <select
            id="header-city"
            value={city}
            onChange={(event) => setCity(event.target.value as CityId)}
            className="h-11 rounded-full border border-line bg-card px-3 text-sm"
          >
            {cities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="hidden sm:block">
            <AuthLink />
          </div>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line xl:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      {open ? (
        <div className="border-t border-line xl:hidden">
          <Container className="flex flex-col gap-1 py-3">
            <Link to="/search" className="flex h-11 items-center text-sm">
              Search
            </Link>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="flex h-11 items-center text-sm">
                {item.label}
              </Link>
            ))}
            <div className="py-2 sm:hidden">
              <AuthLink />
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-navy text-paper">
      <Container className="grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-semibold">CompareX</p>
          <p className="mt-2 text-sm text-paper/80">
            Everything students need. One platform. Smarter decisions. Vienna first, Milan next.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Explore</p>
          <ul className="mt-2 space-y-2 text-paper/80">
            <li><Link to="/package-builder" className="hover:text-paper">Package builder</Link></li>
            <li><Link to="/search" className="hover:text-paper">Search</Link></li>
            <li><Link to="/dashboard" className="hover:text-paper">Dashboard</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">About this preview</p>
          <ul className="mt-2 space-y-2 text-paper/80">
            <li><Link to="/privacy" className="hover:text-paper">Privacy</Link></li>
            <li><Link to="/contact" className="hover:text-paper">Contact</Link></li>
            <li><Link to="/account" className="hover:text-paper">Account settings</Link></li>
          </ul>
        </div>
      </Container>
      <Container className="border-t border-paper/15 py-5 text-sm text-paper/75">
        CompareX compares and refers. It does not sell housing, mobile, transport, gyms or streaming, and it has no commercial partnership with the providers linked here. A contract exists only if you complete it on the provider’s own site.
      </Container>
    </footer>
  );
}
