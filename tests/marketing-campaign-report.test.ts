import { describe, expect, it } from "vitest";

import {
  bucketStatusFilter,
  tallyStatusCounts,
  toRecipientRow,
} from "@/features/marketing/lib/campaigns/campaign-report-summary";

describe("tallyStatusCounts", () => {
  it("folds raw status counts into report buckets", () => {
    expect(
      tallyStatusCounts({
        sent: 1200,
        failed: 3,
        skipped_consent: 4,
        skipped_cap: 5,
        pending: 600,
        sending: 2,
      }),
    ).toEqual({ targeted: 1814, sent: 1200, failed: 3, skipped: 9, pending: 602 });
  });
});

describe("bucketStatusFilter", () => {
  it("maps buckets to Mongo filters", () => {
    expect(bucketStatusFilter("all")).toEqual({});
    expect(bucketStatusFilter("sent")).toEqual({ status: "sent" });
    expect(bucketStatusFilter("pending")).toEqual({ status: { $in: ["pending", "sending"] } });
    expect(bucketStatusFilter("skipped")).toEqual({ status: { $regex: "^skipped" } });
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
