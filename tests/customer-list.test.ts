import { afterEach, describe, expect, it, vi } from "vitest";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { listCustomers } from "@/features/customers-admin/lib/customer-list/list-customers";
import { buildCustomerListFilter } from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import { customerListQuerySchema } from "@/features/customers-admin/schema/customer-list.schema";

const auth = vi.hoisted(() => ({ role: "admin" as "admin" | "driver" }));

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () =>
    auth.role === "admin"
      ? { ok: true, session: { user: { id: "admin-1", role: "admin" } } }
      : {
          ok: false,
          response: new Response(
            JSON.stringify({ success: false, error: "forbidden" }),
            { status: 403 },
          ),
        },
}));

function params(input: Record<string, unknown> = {}) {
  return customerListQuerySchema.parse(input);
}

function pad(value: number, width = 5) {
  return String(value).padStart(width, "0");
}

function customerDoc(index: number, overrides: Record<string, unknown> = {}) {
  const id = pad(index);
  return {
    emailLower: `customer${id}@example.com`,
    nameLower: `customer ${id}`,
    name: `Customer ${id}`,
    phoneDigits: `4179${pad(index, 6)}`,
    verifiedPhone: "",
    rideCount: 0,
    completedCount: 0,
    totalSpendMinor: 0,
    currency: "EUR",
    firstRideAt: null,
    lastRideAt: null,
    hasUpcoming: false,
    locale: "en",
    emailConsent: "none",
    whatsappConsent: "none",
    rebuiltAt: new Date(),
    createdAt: new Date(Date.UTC(2025, 0, 1) + index * 1000),
    ...overrides,
  };
}

async function seed(docs: Array<Record<string, unknown>>) {
  await CustomerStats.insertMany(docs);
  await CustomerStats.syncIndexes();
}

function emails(page: Awaited<ReturnType<typeof listCustomers>>) {
  if (!page.ok) throw new Error("expected a page");
  return page.rows.map((row) => row.email);
}

type CollectedRow = {
  id: string;
  spendMinor: number;
  lastRideAt: string | null;
};

async function collect(input: Record<string, unknown>): Promise<CollectedRow[]> {
  const rows: CollectedRow[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    pages += 1;
    if (pages > 10) throw new Error("cursor did not advance");
    const page = await listCustomers(
      params(cursor ? { ...input, cursor } : input),
    );
    if (!page.ok) throw new Error(page.error);
    rows.push(
      ...page.rows.map((row) => ({
        id: row.id,
        spendMinor: row.spendMinor,
        lastRideAt: row.lastRideAt,
      })),
    );
    cursor = page.nextCursor;
  } while (cursor);
  return rows;
}

afterEach(() => {
  auth.role = "admin";
});

describe("customers list search", () => {
  it("matches email, name and phone prefixes case-insensitively without substring scans", async () => {
    await seed([
      customerDoc(1, {
        emailLower: "ada@example.com",
        name: "Ada Lovelace",
        nameLower: "ada lovelace",
        phoneDigits: "41791111111",
      }),
      customerDoc(2, {
        emailLower: "adam@example.com",
        name: "Adam Smith",
        nameLower: "adam smith",
        phoneDigits: "41792222222",
      }),
      customerDoc(3, {
        emailLower: "bob@example.com",
        name: "Bob Stone",
        nameLower: "bob stone",
        phoneDigits: "41799999999",
      }),
    ]);

    expect(emails(await listCustomers(params({ q: "ADA" })))).toEqual([
      "ada@example.com",
      "adam@example.com",
    ]);
    expect(emails(await listCustomers(params({ q: "ada l" })))).toEqual([
      "ada@example.com",
    ]);
    expect(emails(await listCustomers(params({ q: "417999" })))).toEqual([
      "bob@example.com",
    ]);
    expect(emails(await listCustomers(params({ q: "lovelace" })))).toEqual([]);
    expect(emails(await listCustomers(params({ q: "nomatch" })))).toEqual([]);
  });

  it("builds range queries for indexed prefixes and no pattern operators", () => {
    const filter = buildCustomerListFilter(params({ q: "ada", ridesMin: 1 }), new Date());
    const serialized = JSON.stringify(filter);
    expect(serialized).toContain('"$gte":"ada"');
    expect(serialized).not.toContain("$regex");
    expect(serialized).not.toContain("$where");
  });
});

describe("customers list filters", () => {
  it("applies ride, spend, activity, verification, consent and locale filters", async () => {
    const recent = new Date(Date.now() - 5 * 86_400_000);
    const old = new Date(Date.now() - 100 * 86_400_000);
    await seed([
      customerDoc(1, {
        emailLower: "recent@example.com",
        rideCount: 2,
        totalSpendMinor: 5_000,
        lastRideAt: recent,
        verifiedPhone: "41791111111",
        hasUpcoming: true,
        locale: "fr",
        emailConsent: "granted",
      }),
      customerDoc(2, {
        emailLower: "old@example.com",
        rideCount: 5,
        totalSpendMinor: 20_000,
        lastRideAt: old,
        whatsappConsent: "granted",
      }),
      customerDoc(3, {
        emailLower: "never@example.com",
        rideCount: 1,
      }),
    ]);

    expect(emails(await listCustomers(params({ ridesMin: 2, ridesMax: 4 })))).toEqual([
      "recent@example.com",
    ]);
    expect(
      emails(await listCustomers(params({ spendMin: 50, spendMax: 100 }))),
    ).toEqual(["recent@example.com"]);
    expect(emails(await listCustomers(params({ lastRide: "never" })))).toEqual([
      "never@example.com",
    ]);
    expect(
      emails(await listCustomers(params({ lastRide: "within", lastRideDays: 30 }))),
    ).toEqual(["recent@example.com"]);
    expect(
      emails(await listCustomers(params({ lastRide: "before", lastRideDays: 30 }))),
    ).toEqual(["old@example.com"]);
    expect(emails(await listCustomers(params({ verifiedWhatsApp: "yes" })))).toEqual([
      "recent@example.com",
    ]);
    expect(emails(await listCustomers(params({ verifiedWhatsApp: "no" })))).toEqual([
      "old@example.com",
      "never@example.com",
    ]);
    expect(emails(await listCustomers(params({ emailConsent: "granted" })))).toEqual([
      "recent@example.com",
    ]);
    expect(emails(await listCustomers(params({ emailConsent: "none" })))).toEqual([
      "old@example.com",
      "never@example.com",
    ]);
    expect(
      emails(await listCustomers(params({ whatsappConsent: "granted" }))),
    ).toEqual(["old@example.com"]);
    expect(emails(await listCustomers(params({ locale: "fr" })))).toEqual([
      "recent@example.com",
    ]);
    expect(emails(await listCustomers(params({ upcoming: "yes" })))).toEqual([
      "recent@example.com",
    ]);
    expect(
      emails(await listCustomers(params({ upcoming: "no", locale: "en" }))),
    ).toEqual(["old@example.com", "never@example.com"]);
  });
});

describe("customers list sorting and cursor pagination", () => {
  async function seedPages() {
    const docs = Array.from({ length: 120 }, (_, index) =>
      customerDoc(index, {
        emailLower: `customer${pad(index)}@example.com`,
        rideCount: index % 7,
        totalSpendMinor: (index % 11) * 1_000,
        lastRideAt:
          index >= 95
            ? null
            : new Date(Date.UTC(2025, 0, 1) + (index % 30) * 86_400_000),
      }),
    );
    await seed(docs);
  }

  it("pages by spend without gaps or duplicates and in exact order", async () => {
    await seedPages();
    const rows = await collect({ sort: "spend", dir: "desc" });
    expect(rows).toHaveLength(120);
    expect(new Set(rows.map((row) => row.id)).size).toBe(120);

    const expected = await CustomerStats.find()
      .sort({ totalSpendMinor: -1, emailLower: 1 })
      .lean();
    expect(rows.map((row) => row.id)).toEqual(
      expected.map((doc) => doc.emailLower),
    );

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];
      expect(previous.spendMinor).toBeGreaterThanOrEqual(current.spendMinor);
      if (previous.spendMinor === current.spendMinor) {
        expect(previous.id < current.id).toBe(true);
      }
    }
  });

  it("keeps null last-ride rows last and resumes across a null cursor", async () => {
    await seedPages();
    const rows = await collect({ sort: "last-ride", dir: "desc" });
    expect(rows).toHaveLength(120);

    const expected = await CustomerStats.find()
      .sort({ lastRideAt: -1, emailLower: 1 })
      .lean();
    expect(rows.map((row) => row.id)).toEqual(
      expected.map((doc) => doc.emailLower),
    );

    const firstNull = rows.findIndex((row) => row.lastRideAt === null);
    expect(firstNull).toBeGreaterThan(0);
    expect(rows.slice(firstNull).every((row) => row.lastRideAt === null)).toBe(
      true,
    );

    const ascending = await collect({ sort: "last-ride", dir: "asc" });
    const expectedAscending = await CustomerStats.find()
      .sort({ lastRideAt: 1, emailLower: 1 })
      .lean();
    expect(ascending.map((row) => row.id)).toEqual(
      expectedAscending.map((doc) => doc.emailLower),
    );
  });

  it("sorts names ascending, creation dates descending and emails descending", async () => {
    await seedPages();
    const names = await collect({ sort: "name", dir: "asc" });
    const expectedNames = await CustomerStats.find()
      .sort({ nameLower: 1, emailLower: 1 })
      .lean();
    expect(names.map((row) => row.id)).toEqual(
      expectedNames.map((doc) => doc.emailLower),
    );

    const created = await collect({ sort: "created", dir: "desc" });
    const expectedCreated = await CustomerStats.find()
      .sort({ createdAt: -1, emailLower: 1 })
      .lean();
    expect(created.map((row) => row.id)).toEqual(
      expectedCreated.map((doc) => doc.emailLower),
    );

    const mail = await collect({ sort: "email", dir: "desc" });
    expect(mail.map((row) => row.id)).toEqual(
      [...expectedCreated.map((doc) => doc.emailLower)].sort().reverse(),
    );
  });

  it("rejects cursors that are malformed or belong to another sort", async () => {
    await seed(Array.from({ length: 60 }, (_, index) => customerDoc(index)));
    expect(await listCustomers(params({ cursor: "not-a-cursor" }))).toEqual({
      ok: false,
      error: "invalid_cursor",
    });

    const first = await listCustomers(params({ sort: "spend", dir: "desc" }));
    if (!first.ok || !first.nextCursor) throw new Error("expected a cursor");
    const mismatch = await listCustomers(
      params({ sort: "rides", dir: "desc", cursor: first.nextCursor }),
    );
    expect(mismatch).toEqual({ ok: false, error: "invalid_cursor" });
  });
});

describe("GET /api/admin/customers", () => {
  it("returns a page for admins and 403 for other roles", async () => {
    await seed([customerDoc(1, { emailLower: "ada@example.com", name: "Ada" })]);
    const { GET } = await import("@/app/api/admin/customers/route");

    const ok = await GET(
      new Request("http://x/api/admin/customers?q=ada&sort=spend&dir=desc"),
    );
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as {
      success: boolean;
      rows: Array<{ email: string }>;
    };
    expect(body).toMatchObject({ success: true });
    expect(body.rows.map((row) => row.email)).toEqual(["ada@example.com"]);

    const bad = await GET(
      new Request("http://x/api/admin/customers?ridesMin=-1"),
    );
    expect(bad.status).toBe(400);
    const badCursor = await GET(
      new Request("http://x/api/admin/customers?cursor=nope"),
    );
    expect(badCursor.status).toBe(400);

    auth.role = "driver";
    const forbidden = await GET(
      new Request("http://x/api/admin/customers"),
    );
    expect(forbidden.status).toBe(403);
  });
});

describe("customers list performance", () => {
  it("serves a page from 10k seeded rows in under 300ms", async () => {
    const docs = Array.from({ length: 10_000 }, (_, index) =>
      customerDoc(index, {
        emailLower: `customer${pad(index)}@example.com`,
        nameLower: `customer ${pad(index)}`,
        phoneDigits: `4179${pad(index, 8)}`,
        rideCount: index % 40,
        totalSpendMinor: (index % 50) * 1_000,
        lastRideAt:
          index % 7 === 0
            ? null
            : new Date(Date.UTC(2025, 0, 1) + (index % 365) * 86_400_000),
        locale: index % 2 === 0 ? "en" : "fr",
      }),
    );
    await seed(docs);

    await listCustomers(params({}));
    const timings: number[] = [];
    for (let run = 0; run < 3; run += 1) {
      const started = performance.now();
      const page = await listCustomers(params({}));
      timings.push(performance.now() - started);
      if (!page.ok) throw new Error("expected a page");
      expect(page.rows).toHaveLength(50);
    }

    expect(Math.max(...timings)).toBeLessThan(300);
  });
});
