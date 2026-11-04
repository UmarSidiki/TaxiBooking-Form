import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { connectDB } from "@/shared/db";
import CustomerSession from "@/features/customers/model/CustomerSession";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import AdminNote from "@/features/customers-admin/model/AdminNote";
import AdminAuditLog, {
  ADMIN_AUDIT_RETENTION_SECONDS,
} from "@/features/customers-admin/model/AdminAuditLog";
import { AdminNoteText } from "@/features/customers-admin/ui/admin-note-text";

const auth = vi.hoisted(() => ({
  role: "admin" as "admin" | "driver",
  userId: "admin-1",
  userEmail: "admin1@example.com",
  userName: "Admin One",
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
          id: auth.userId,
          role: auth.role,
          email: auth.userEmail,
          name: auth.userName,
        },
      },
    };
  },
}));

const EMAIL = "ada@example.com";
const OTHER_EMAIL = "bob@example.com";
const FUTURE = new Date("2026-01-01T12:00:00.000Z");

beforeEach(() => {
  auth.role = "admin";
  auth.userId = "admin-1";
  auth.userEmail = "admin1@example.com";
  auth.userName = "Admin One";
});

afterEach(() => {
  auth.role = "admin";
});

function params<T extends Record<string, string>>(values: T) {
  return { params: Promise.resolve(values) };
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function notesUrl(email = EMAIL) {
  return `http://x/api/admin/customers/${encodeURIComponent(email)}/notes`;
}

async function seedCustomer(email = EMAIL) {
  await connectDB();
  await CustomerStats.create({
    emailLower: email,
    name: email === EMAIL ? "Ada Lovelace" : "Bob Rider",
    nameLower: email === EMAIL ? "ada lovelace" : "bob rider",
  });
}

async function createNote(text: string, email = EMAIL) {
  const { POST } = await import("@/app/api/admin/customers/[id]/notes/route");
  const response = await POST(
    jsonRequest(notesUrl(email), "POST", { text }),
    params({ id: email }),
  );
  const body = (await response.json()) as {
    success: boolean;
    note?: { id: string; text: string; authorId: string; canEdit: boolean };
  };
  return { response, body };
}

async function getNotes(email = EMAIL) {
  const { GET } = await import("@/app/api/admin/customers/[id]/notes/route");
  const response = await GET(
    new Request(notesUrl(email), { method: "GET" }),
    params({ id: email }),
  );
  const body = (await response.json()) as {
    success: boolean;
    notes?: Array<{ id: string; text: string; authorId: string; canEdit: boolean }>;
  };
  return { response, body };
}

async function patchNote(noteId: string, text: string, email = EMAIL) {
  const { PATCH } = await import(
    "@/app/api/admin/customers/[id]/notes/[noteId]/route"
  );
  return PATCH(
    jsonRequest(`${notesUrl(email)}/${noteId}`, "PATCH", { text }),
    params({ id: email, noteId }),
  );
}

async function deleteNote(noteId: string, email = EMAIL) {
  const { DELETE } = await import(
    "@/app/api/admin/customers/[id]/notes/[noteId]/route"
  );
  return DELETE(
    new Request(`${notesUrl(email)}/${noteId}`, { method: "DELETE" }),
    params({ id: email, noteId }),
  );
}

describe("admin notes", () => {
  it("creates a note and audits the mutation with safe metadata", async () => {
    await seedCustomer();
    const { response, body } = await createNote("Prefers a quiet ride");

    expect(response.status).toBe(201);
    expect(body.note).toMatchObject({
      text: "Prefers a quiet ride",
      authorId: "admin-1",
      canEdit: true,
    });

    const stored = await AdminNote.findOne({ emailLower: EMAIL }).lean();
    expect(stored?.text).toBe("Prefers a quiet ride");
    expect(stored?.deletedAt).toBeNull();

    const audit = await AdminAuditLog.findOne({
      action: "customer.note.create",
    }).lean();
    expect(audit).toMatchObject({
      actorId: "admin-1",
      actorEmail: "admin1@example.com",
      actorName: "Admin One",
      actorRole: "admin",
      targetType: "customer",
      targetId: EMAIL,
      metadata: { noteId: String(stored?._id), length: 20 },
    });
  });

  it("lets only the author edit or delete a note", async () => {
    await seedCustomer();
    const { body } = await createNote("Original text");
    const noteId = body.note?.id;
    if (!noteId) throw new Error("expected note id");

    auth.userId = "admin-2";
    auth.userEmail = "admin2@example.com";
    auth.userName = "Admin Two";

    const deniedEdit = await patchNote(noteId, "Hijacked");
    expect(deniedEdit.status).toBe(403);
    expect((await AdminNote.findById(noteId).lean())?.text).toBe("Original text");
    expect(await AdminAuditLog.countDocuments({ action: "customer.note.update" })).toBe(0);

    const listed = await getNotes();
    expect(listed.response.status).toBe(200);
    expect(listed.body.notes?.[0]).toMatchObject({ id: noteId, canEdit: false });

    auth.userId = "admin-1";
    auth.userEmail = "admin1@example.com";
    auth.userName = "Admin One";

    const allowedEdit = await patchNote(noteId, "Updated text");
    expect(allowedEdit.status).toBe(200);
    expect((await AdminNote.findById(noteId).lean())?.text).toBe("Updated text");

    const updateAudit = await AdminAuditLog.findOne({
      action: "customer.note.update",
    }).lean();
    expect(updateAudit?.metadata).toMatchObject({ noteId, length: 12 });
    expect(JSON.stringify(updateAudit?.metadata)).not.toContain("Updated text");

    auth.userId = "admin-2";
    const deniedDelete = await deleteNote(noteId);
    expect(deniedDelete.status).toBe(403);
    expect((await AdminNote.findById(noteId).lean())?.deletedAt).toBeNull();

    auth.userId = "admin-1";
    const allowedDelete = await deleteNote(noteId);
    expect(allowedDelete.status).toBe(200);
    expect((await AdminNote.findById(noteId).lean())?.deletedAt).toBeInstanceOf(Date);
    expect((await getNotes()).body.notes).toEqual([]);

    expect(
      await AdminAuditLog.countDocuments({ action: "customer.note.delete" }),
    ).toBe(1);
  });

  it("keeps HTML inert and validates the 2k character limit", async () => {
    await seedCustomer();
    const raw = '<script>alert("x")</script><img src=x onerror=alert(1)>';
    const { body } = await createNote(raw);
    expect(body.note?.text).toBe(raw);

    const stored = await AdminNote.findById(body.note?.id).lean();
    expect(stored?.text).toBe(raw);

    const html = renderToStaticMarkup(<AdminNoteText text={raw} />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<script>");

    const tooLong = await createNote("x".repeat(2001));
    expect(tooLong.response.status).toBe(400);
    const empty = await createNote("   ");
    expect(empty.response.status).toBe(400);
  });

  it("does not touch notes that belong to another customer", async () => {
    await seedCustomer();
    await seedCustomer(OTHER_EMAIL);
    const { body } = await createNote("Ada only");
    const noteId = body.note?.id;
    if (!noteId) throw new Error("expected note id");

    const response = await patchNote(noteId, "Cross-customer", OTHER_EMAIL);
    expect(response.status).toBe(404);
    expect((await AdminNote.findById(noteId).lean())?.text).toBe("Ada only");
  });

  it("returns 404 for unknown customers and 403 for non-admin roles", async () => {
    await seedCustomer();
    const unknown = await createNote("Hello", "nobody@example.com");
    expect(unknown.response.status).toBe(404);

    auth.role = "driver";
    const forbidden = await getNotes();
    expect(forbidden.response.status).toBe(403);
  });
});

describe("session revokes are audited", () => {
  it("audits revoke-all and single session revokes", async () => {
    await seedCustomer();
    await CustomerSession.create({
      idHash: "hash-audit-1",
      emailLower: EMAIL,
      expiresAt: FUTURE,
      uaFamily: "desktop",
      ipPrefix: "41.23",
    });

    const { DELETE: revokeAll } = await import(
      "@/app/api/admin/customers/[id]/sessions/route"
    );
    const all = await revokeAll(
      new Request(`http://x/api/admin/customers/${EMAIL}/sessions`, {
        method: "DELETE",
      }),
      params({ id: EMAIL }),
    );
    expect(all.status).toBe(200);
    expect(await all.json()).toMatchObject({ success: true, revoked: 1 });

    const allAudit = await AdminAuditLog.findOne({
      action: "customer.sessions.revoke_all",
    }).lean();
    expect(allAudit?.metadata).toMatchObject({ revoked: 1 });

    const second = await CustomerSession.create({
      idHash: "hash-audit-2",
      emailLower: EMAIL,
      expiresAt: FUTURE,
      uaFamily: "mobile",
      ipPrefix: "41.24",
    });
    const { DELETE: revokeOne } = await import(
      "@/app/api/admin/customers/[id]/sessions/[sessionId]/route"
    );
    const one = await revokeOne(
      new Request(
        `http://x/api/admin/customers/${EMAIL}/sessions/${second._id}`,
        { method: "DELETE" },
      ),
      params({ id: EMAIL, sessionId: String(second._id) }),
    );
    expect(one.status).toBe(200);

    const oneAudit = await AdminAuditLog.findOne({
      action: "customer.sessions.revoke",
    }).lean();
    expect(oneAudit?.metadata).toMatchObject({ sessionId: String(second._id) });
  });
});

describe("audit log API", () => {
  async function seedAudit() {
    await connectDB();
    await AdminAuditLog.create([
      {
        actorId: "admin-1",
        actorEmail: "admin1@example.com",
        actorName: "Admin One",
        actorRole: "admin",
        action: "customer.note.create",
        targetType: "customer",
        targetId: EMAIL,
        metadata: { length: 3 },
        at: new Date("2025-01-02T10:00:00.000Z"),
      },
      {
        actorId: "admin-2",
        actorEmail: "admin2@example.com",
        actorName: "Admin Two",
        actorRole: "admin",
        action: "campaign.send",
        targetType: "campaign",
        targetId: "campaign-1",
        metadata: { sent: 5 },
        at: new Date("2025-01-03T10:00:00.000Z"),
      },
    ]);
  }

  async function getAudit(query = "") {
    const { GET } = await import("@/app/api/admin/audit/route");
    const response = await GET(
      new Request(`http://x/api/admin/audit${query}`, { method: "GET" }),
    );
    const body = (await response.json()) as {
      success: boolean;
      rows?: Array<{ action: string; targetId: string; actorEmail: string }>;
      nextCursor?: string | null;
    };
    return { response, body };
  }

  it("filters by action, target and actor prefix and paginates", async () => {
    await seedAudit();

    const byAction = await getAudit("?action=customer.note.create");
    expect(byAction.response.status).toBe(200);
    expect(byAction.body.rows?.map((row) => row.action)).toEqual([
      "customer.note.create",
    ]);

    const byTarget = await getAudit(`?target=${encodeURIComponent(EMAIL)}`);
    expect(byTarget.body.rows).toHaveLength(1);
    expect(byTarget.body.rows?.[0].targetId).toBe(EMAIL);

    const byActor = await getAudit("?actor=admin2");
    expect(byActor.body.rows?.map((row) => row.actorEmail)).toEqual([
      "admin2@example.com",
    ]);

    const firstPage = await getAudit("?limit=1");
    expect(firstPage.body.rows).toHaveLength(1);
    expect(firstPage.body.nextCursor).toBeTruthy();

    const secondPage = await getAudit(
      `?limit=1&cursor=${encodeURIComponent(firstPage.body.nextCursor ?? "")}`,
    );
    expect(secondPage.body.rows).toHaveLength(1);
    expect(secondPage.body.rows?.[0].action).not.toBe(firstPage.body.rows?.[0].action);
  });

  it("rejects invalid filters and non-admin roles", async () => {
    await seedAudit();
    const invalid = await getAudit("?action=not-a-real-action");
    expect(invalid.response.status).toBe(400);

    const badCursor = await getAudit("?cursor=nope");
    expect(badCursor.response.status).toBe(400);

    auth.role = "driver";
    const forbidden = await getAudit();
    expect(forbidden.response.status).toBe(403);
  });

  it("returns activity for one customer only and 404 for unknown customers", async () => {
    await seedAudit();
    await AdminAuditLog.create({
      action: "campaign.send",
      targetType: "customer",
      targetId: OTHER_EMAIL,
      actorEmail: "admin2@example.com",
      at: new Date("2025-01-04T10:00:00.000Z"),
    });
    await seedCustomer();

    const { GET } = await import(
      "@/app/api/admin/customers/[id]/activity/route"
    );
    const response = await GET(
      new Request(`http://x/api/admin/customers/${EMAIL}/activity`, {
        method: "GET",
      }),
      params({ id: EMAIL }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      rows: Array<{ targetId: string }>;
    };
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].targetId).toBe(EMAIL);

    const unknown = await GET(
      new Request("http://x/api/admin/customers/nobody@example.com/activity", {
        method: "GET",
      }),
      params({ id: "nobody@example.com" }),
    );
    expect(unknown.status).toBe(404);
  });

  it("retains audit entries for two years with a TTL index", async () => {
    await connectDB();
    await AdminAuditLog.init();
    const indexes = await AdminAuditLog.collection.indexes();
    const ttl = indexes.find(
      (index) =>
        (index.key as Record<string, number>).at === 1 &&
        typeof index.expireAfterSeconds === "number",
    );
    expect(ttl?.expireAfterSeconds).toBe(ADMIN_AUDIT_RETENTION_SECONDS);
    expect(ADMIN_AUDIT_RETENTION_SECONDS).toBe(2 * 365 * 24 * 60 * 60);
  });
});
