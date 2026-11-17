import { createServerFn } from "@tanstack/react-start";
import {
  getOffer,
  isCategoryId,
  isCityId,
  type CategoryId,
  type CityId,
} from "@/data/catalog";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Pick } from "@/lib/package-math";

export type Profile = {
  displayName: string;
  university: string;
  city: CityId;
  monthlyBudget: number;
  shareConsent: boolean;
};

export type SavedItem = {
  category: CategoryId;
  offerId: string;
  userMonthly: number | null;
};

export type SavedPackage = {
  id: string;
  name: string;
  city: CityId;
  budget: number;
  items: SavedItem[];
  createdAt: string;
};

export type ServiceStatus = {
  offerId: string;
  status: "saved" | "handoff";
  updatedAt: string;
};

export type AccountNote = {
  id: string;
  body: string;
  createdAt: string;
};

export type AccountSnapshot = {
  profile: Profile | null;
  packages: SavedPackage[];
  favoriteIds: string[];
  statuses: ServiceStatus[];
  notes: AccountNote[];
};

type ProfileRow = {
  display_name: string;
  university: string;
  city: string;
  monthly_budget: number;
  share_consent: boolean;
};

type PackageRow = {
  id: string;
  name: string;
  city: string;
  budget: number;
  items: string;
  created_at: string;
};

function asCity(value: string): CityId {
  return isCityId(value) ? value : "vienna";
}

function readItems(raw: string): SavedItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row.category !== "string" || !isCategoryId(row.category)) return [];
      if (typeof row.offerId !== "string") return [];
      const userMonthly =
        typeof row.userMonthly === "number" && Number.isFinite(row.userMonthly)
          ? Math.round(row.userMonthly * 100) / 100
          : null;
      return [{ category: row.category, offerId: row.offerId, userMonthly }];
    });
  } catch {
    return [];
  }
}

function stamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

export const getAccount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AccountSnapshot> => {
    const sql = await getSql();
    const userId = context.userId;
    const profiles = await sql<ProfileRow>`
      select display_name, university, city, monthly_budget, share_consent
      from profiles where user_id = ${userId}
    `;
    const packages = await sql<PackageRow>`
      select id, name, city, budget, items, created_at
      from saved_packages where user_id = ${userId}
      order by created_at desc
    `;
    const favorites = await sql<{ offer_id: string }>`
      select offer_id from favorites where user_id = ${userId} order by created_at desc
    `;
    const statuses = await sql<{ offer_id: string; status: string; updated_at: string }>`
      select offer_id, status, updated_at from service_status where user_id = ${userId}
    `;
    const notes = await sql<{ id: string; body: string; created_at: string }>`
      select id, body, created_at from account_notes
      where user_id = ${userId} order by created_at desc limit 20
    `;
    const profile = profiles[0];
    return {
      profile: profile
        ? {
            displayName: profile.display_name,
            university: profile.university,
            city: asCity(profile.city),
            monthlyBudget: profile.monthly_budget,
            shareConsent: Boolean(profile.share_consent),
          }
        : null,
      packages: packages.map((row) => ({
        id: row.id,
        name: row.name,
        city: asCity(row.city),
        budget: row.budget,
        items: readItems(row.items),
        createdAt: stamp(row.created_at),
      })),
      favoriteIds: favorites.map((row) => row.offer_id),
      statuses: statuses.map((row) => ({
        offerId: row.offer_id,
        status: row.status === "handoff" ? "handoff" : "saved",
        updatedAt: stamp(row.updated_at),
      })),
      notes: notes.map((row) => ({
        id: row.id,
        body: row.body,
        createdAt: stamp(row.created_at),
      })),
    };
  });

export const listFavoriteIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ offer_id: string }>`
      select offer_id from favorites where user_id = ${context.userId}
    `;
    return rows.map((row) => row.offer_id);
  });

function cleanItems(input: unknown, city: CityId): SavedItem[] | string {
  if (!Array.isArray(input)) return "Add at least one service.";
  if (input.length === 0 || input.length > 5) return "A package needs between 1 and 5 services.";
  const items: SavedItem[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (!item || typeof item !== "object") return "A service in this package is invalid.";
    const row = item as Record<string, unknown>;
    if (typeof row.category !== "string" || !isCategoryId(row.category)) return "Unknown category.";
    if (typeof row.offerId !== "string") return "Unknown offer.";
    const offer = getOffer(row.offerId);
    if (!offer || offer.city !== city || offer.category !== row.category) {
      return "That offer is not in the selected city.";
    }
    if (seen.has(row.category)) return "Pick one offer per category.";
    seen.add(row.category);
    let userMonthly: number | null = null;
    if (row.userMonthly != null) {
      if (typeof row.userMonthly !== "number" || !Number.isFinite(row.userMonthly)) {
        return "Enter a monthly figure between 0 and 20,000.";
      }
      if (row.userMonthly < 0 || row.userMonthly > 20000) {
        return "Enter a monthly figure between 0 and 20,000.";
      }
      userMonthly = Math.round(row.userMonthly * 100) / 100;
    }
    items.push({ category: row.category, offerId: offer.id, userMonthly });
  }
  return items;
}

export const savePackage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    if (!data || typeof data !== "object") return { ok: false, error: "Invalid package." };
    const body = data as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 1 || name.length > 80) return { ok: false, error: "Name the package in 80 characters or fewer." };
    if (typeof body.city !== "string" || !isCityId(body.city)) return { ok: false, error: "Choose Vienna or Milan." };
    if (typeof body.budget !== "number" || !Number.isFinite(body.budget) || body.budget < 0 || body.budget > 20000) {
      return { ok: false, error: "Budget must be between 0 and 20,000." };
    }
    const items = cleanItems(body.items, body.city);
    if (typeof items === "string") return { ok: false, error: items };
    const sql = await getSql();
    const userId = context.userId;
    const count = await sql<{ n: number }>`
      select count(*)::int as n from saved_packages where user_id = ${userId}
    `;
    if ((count[0]?.n ?? 0) >= 30) return { ok: false, error: "You already have 30 saved packages. Remove one first." };
    const id = crypto.randomUUID();
    const budget = Math.round(body.budget);
    await sql`
      insert into saved_packages (id, user_id, name, city, budget, items)
      values (${id}, ${userId}, ${name}, ${body.city}, ${budget}, ${JSON.stringify(items)})
    `;
    for (const item of items) {
      await sql`
        insert into service_status (user_id, offer_id, status)
        values (${userId}, ${item.offerId}, 'saved')
        on conflict (user_id, offer_id) do update
        set status = case when service_status.status = 'handoff' then 'handoff' else 'saved' end,
            updated_at = now()
      `;
    }
    return { ok: true, id };
  });

export const deletePackage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => (typeof id === "string" ? id : ""))
  .handler(async ({ context, data }) => {
    if (!data) return { ok: false as const, error: "Missing package." };
    const sql = await getSql();
    await sql`delete from saved_packages where id = ${data} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const setFavorite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }) => {
    if (!data || typeof data !== "object") return { ok: false as const, error: "Invalid favorite." };
    const body = data as Record<string, unknown>;
    if (typeof body.offerId !== "string" || !getOffer(body.offerId)) {
      return { ok: false as const, error: "Unknown offer." };
    }
    const sql = await getSql();
    if (body.saved) {
      await sql`
        insert into favorites (user_id, offer_id) values (${context.userId}, ${body.offerId})
        on conflict do nothing
      `;
    } else {
      await sql`delete from favorites where user_id = ${context.userId} and offer_id = ${body.offerId}`;
    }
    return { ok: true as const };
  });

export const markHandoff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((offerId: unknown) => (typeof offerId === "string" ? offerId : ""))
  .handler(async ({ context, data }) => {
    if (!getOffer(data)) return { ok: false as const, error: "Unknown offer." };
    const sql = await getSql();
    await sql`
      insert into service_status (user_id, offer_id, status)
      values (${context.userId}, ${data}, 'handoff')
      on conflict (user_id, offer_id) do update
      set status = 'handoff', updated_at = now()
    `;
    return { ok: true as const };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => input)
  .handler(async ({ context, data }): Promise<{ ok: true; profile: Profile } | { ok: false; error: string }> => {
    if (!data || typeof data !== "object") return { ok: false, error: "Invalid profile." };
    const body = data as Record<string, unknown>;
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const university = typeof body.university === "string" ? body.university.trim() : "";
    if (displayName.length > 80 || university.length > 120) {
      return { ok: false, error: "Name or university is too long." };
    }
    if (typeof body.city !== "string" || !isCityId(body.city)) return { ok: false, error: "Choose Vienna or Milan." };
    if (typeof body.monthlyBudget !== "number" || !Number.isFinite(body.monthlyBudget)) {
      return { ok: false, error: "Enter a monthly budget." };
    }
    const monthlyBudget = Math.round(body.monthlyBudget);
    if (monthlyBudget < 0 || monthlyBudget > 20000) return { ok: false, error: "Budget must be between 0 and 20,000." };
    const shareConsent = Boolean(body.shareConsent);
    const sql = await getSql();
    await sql`
      insert into profiles (user_id, display_name, university, city, monthly_budget, share_consent)
      values (${context.userId}, ${displayName}, ${university}, ${body.city}, ${monthlyBudget}, ${shareConsent})
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        university = excluded.university,
        city = excluded.city,
        monthly_budget = excluded.monthly_budget,
        share_consent = excluded.share_consent,
        updated_at = now()
    `;
    return {
      ok: true,
      profile: { displayName, university, city: body.city, monthlyBudget, shareConsent },
    };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((body: unknown) => (typeof body === "string" ? body.trim() : ""))
  .handler(async ({ context, data }) => {
    if (data.length < 1 || data.length > 2000) {
      return { ok: false as const, error: "Write a note between 1 and 2,000 characters." };
    }
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into account_notes (id, user_id, body) values (${id}, ${context.userId}, ${data})
    `;
    return { ok: true as const, id };
  });

export type { Pick };
