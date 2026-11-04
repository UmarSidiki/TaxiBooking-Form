import { afterEach, describe, expect, it, vi } from "vitest";

import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import AdminAuditLog from "@/features/customers-admin/model/AdminAuditLog";
import {
  csvCell,
  neutraliseCsvFormula,
} from "@/features/customers-admin/lib/customer-export/csv-cell";
import {
  CUSTOMER_EXPORT_MAX_ROWS,
  iterateCustomerExportRows,
} from "@/features/customers-admin/lib/customer-export/customer-export-rows";
import { CUSTOMER_EXPORT_HEADER } from "@/features/customers-admin/lib/customer-export/customer-export-row";
import { customerListQuerySchema } from "@/features/customers-admin/schema/customer-list.schema";

const auth = vi.hoisted(() => ({
  role: "admin" as "admin" | "driver",
  email: "admin1@example.com",
  name: "Admin One",
  id: "admin-1",
}));

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => {
    if (auth.role !== "admin") {
      return {
        ok: false as const,
        response: new Response(
          JSON.stringify({ success: false, error: "forbidden" }),
          { status: 403 },
        ),
      };
    }
    return {
      ok: true as const,
      session: {
        user: {
          id: auth.id,
          role: auth.role,
          email: auth.email,
          name: auth.name,
        },
      },
    };
  },
}));

function params(input: Record<string, unknown> = {}) {
  return customerListQuerySchema.parse(input);
}

function customerDoc(
  email: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    emailLower: email,
    nameLower: email,
    name: email.split("@")[0],
    phoneDigits: "41791111111",
    verifiedPhone: "",
    rideCount: 1,
    completedCount: 1,
    totalSpendMinor: 1_000,
    currency: "EUR",
    firstRideAt: new Date("2025-02-01T10:00:00.000Z"),
    lastRideAt: new Date("2025-03-01T10:00:00.000Z"),
    hasUpcoming: false,
    locale: "en",
    emailConsent: "none",
    whatsappConsent: "none",
    rebuiltAt: new Date(),
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    ...overrides,
  };
}

async function seed(docs: Array<Record<string, unknown>>) {
  await CustomerStats.insertMany(docs);
  await CustomerStats.syncIndexes();
}

async function readExport(url = "http://x/api/admin/customers/export") {
  const { GET } = await import("@/app/api/admin/customers/export/route");
  const response = await GET(new Request(url));
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { response, bytes };
}

function bodyLines(bytes: Uint8Array): string[] {
  return new TextDecoder()
    .decode(bytes.slice(3))
    .split("\r\n")
    .filter((line) => line !== "");
}

afterEach(() => {
  auth.role = "admin";
});

describe("CSV cell safety", () => {
  it("prefixes cells that a spreadsheet would execute as formulas", () => {
    expect(neutraliseCsvFormula("=cmd|' /C calc'!A0")).toBe(
      "'=cmd|' /C calc'!A0",
    );
    expect(csvCell("=cmd")).toBe("'=cmd");
    expect(csvCell("+44 79 111 11 11")).toBe("'+44 79 111 11 11");
    expect(csvCell("-42")).toBe("'-42");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\t=cmd")).toBe("'\t=cmd");
    expect(csvCell("plain")).toBe("plain");
  });

  it("quotes commas, quotes and line breaks exactly once", () => {
    expect(csvCell("Doe, Ada")).toBe('"Doe, Ada"');
    expect(csvCell('Ada "A" Doe')).toBe('"Ada ""A"" Doe"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("carriage\rreturn")).toBe('"carriage\rreturn"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(0)).toBe("0");
  });
});

describe("iterateCustomerExportRows", () => {
  it("caps rows at the requested limit and defaults to 50k", async () => {
    expect(CUSTOMER_EXPORT_MAX_ROWS).toBe(50_000);
    await seed(
      Array.from({ length: 5 }, (_, index) =>
        customerDoc(`customer${index}@example.com`),
      ),
    );

    const rows = [];
    for await (const row of iterateCustomerExportRows(params(), { limit: 2 })) {
      rows.push(row);
    }
    expect(rows).toHaveLength(2);
  });
});

describe("GET /api/admin/customers/export", () => {
  it("streams the filtered list with a BOM, safe cells and an audit entry", async () => {
    await seed([
      customerDoc("ada@example.com", {
        name: "Lovelace, Ada",
        emailConsent: "granted",
        totalSpendMinor: 5_000,
        verifiedPhone: "41791111111",
      }),
      customerDoc("evil@example.com", {
        name: "=cmd|' /C calc'!A0",
        emailConsent: "granted",
        totalSpendMinor: 10_000,
        whatsappConsent: "withdrawn",
      }),
      customerDoc("bob@example.com", {
        name: "Bob",
        emailConsent: "none",
        totalSpendMinor: 50_000,
      }),
    ]);

    const { response, bytes } = await readExport(
      "http://x/api/admin/customers/export?emailConsent=granted&sort=spend&dir=desc",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    const lines = bodyLines(bytes);
    expect(lines[0]).toBe(CUSTOMER_EXPORT_HEADER.join(","));
    expect(lines).toHaveLength(3);

    const [evil, ada] = lines.slice(1);
    expect(evil.startsWith("'=cmd|' /C calc'!A0,evil@example.com,")).toBe(true);
    expect(evil).toContain(",100.00,");
    expect(evil).toContain(",withdrawn");
    expect(ada.startsWith('"Lovelace, Ada",ada@example.com,41791111111,yes,')).toBe(
      true,
    );
    expect(ada).toContain(",50.00,");

    const audit = await AdminAuditLog.findOne({ action: "csv.export" }).lean();
    expect(audit).not.toBeNull();
    expect(audit).toMatchObject({
      action: "csv.export",
      targetType: "export",
      actorEmail: "admin1@example.com",
      metadata: { rowCount: 2 },
    });
    expect(String(audit?.metadata?.filters)).toContain("granted");
  });

  it("returns 403 for non-admin roles and writes no audit entry", async () => {
    auth.role = "driver";
    const { response } = await readExport();
    expect(response.status).toBe(403);
    expect(await AdminAuditLog.countDocuments({ action: "csv.export" })).toBe(0);
  });

  it("rejects invalid filters with 400", async () => {
    const { response } = await readExport(
      "http://x/api/admin/customers/export?ridesMin=-1",
    );
    expect(response.status).toBe(400);
  });
});
