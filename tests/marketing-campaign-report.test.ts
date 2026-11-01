import { describe, expect, it } from "vitest";

import {
  tallyRecipients,
  toRecipientRow,
} from "@/features/marketing/lib/campaigns/campaign-report-summary";

describe("tallyRecipients", () => {
  it("groups recipient statuses into report buckets", () => {
    const out = tallyRecipients([
      { status: "sent" },
      { status: "sent" },
      { status: "failed" },
      { status: "skipped_consent" },
      { status: "skipped_cap" },
      { status: "pending" },
      { status: "sending" },
      {},
    ]);
    expect(out).toEqual({ targeted: 8, sent: 2, failed: 1, skipped: 2, pending: 3 });
  });
});

describe("toRecipientRow", () => {
  it("keeps only safe display fields", () => {
    const row = toRecipientRow({
      _id: "abc",
      emailLower: "a@example.com",
      status: "sent",
      sentAt: new Date("2026-11-01T10:00:00Z"),
      idempotencyKey: "secret-ish",
      error: "x".repeat(500),
    });
    expect(row).toEqual({
      id: "abc",
      email: "a@example.com",
      status: "sent",
      sentAt: "2026-11-01T10:00:00.000Z",
      error: "x".repeat(200),
    });
  });
});
