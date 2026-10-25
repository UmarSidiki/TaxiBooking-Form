import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { isCronAuthorized } from "@/shared/http/is-cron-authorized";
import { getPartnerDispatchSettings, clearPartnerDispatchSettingsCache } from "@/features/partners/lib/get-partner-dispatch-settings";
import { Setting } from "@/features/settings/model";

type BookingIndex = {
  fields: Record<string, number>;
  options?: { partialFilterExpression?: { availableForPartners?: boolean } };
};

describe("booking indexes", () => {
  it("covers driver, partner, status, and overflow marketplace queries", () => {
    const indexes: BookingIndex[] = Booking.schema.indexes().map(
      ([fields, options]: [
        Record<string, number>,
        { partialFilterExpression?: { availableForPartners?: boolean } },
      ]) => ({
        fields,
        options,
      }),
    );
    const keys = indexes.map((index) => Object.keys(index.fields).join(","));

    expect(keys).toContain("assignedDriver._id,status,date,time");
    expect(keys).toContain("assignedPartner._id,date,time");
    expect(keys).toContain("status,date");
    expect(keys).toContain("status,pickupReminderSent,date");
    const marketplace = indexes.find(
      (index) =>
        index.options?.partialFilterExpression?.availableForPartners === true,
    );
    expect(marketplace?.fields).toEqual({
      status: 1,
      partnerReviewStatus: 1,
      selectedVehicle: 1,
      partnerAcceptanceDeadline: 1,
    });
  });
});

describe("cron authorization", () => {
  const secret = "secret";

  function request(input: { authorization?: string; cronHeader?: string; key?: string }) {
    const url = new URL("http://127.0.0.1/api/cron");
    if (input.key) url.searchParams.set("key", input.key);
    const headers = new Headers();
    if (input.authorization) headers.set("authorization", input.authorization);
    if (input.cronHeader) headers.set("x-cron-secret", input.cronHeader);
    return new Request(url, { headers });
  }

  it("fails closed and accepts bearer, x-cron-secret, or key", () => {
    expect(isCronAuthorized(request({ authorization: "Bearer secret" }), undefined)).toBe(false);
    expect(isCronAuthorized(request({ authorization: "Bearer secret" }), "")).toBe(false);
    expect(isCronAuthorized(request({}), secret)).toBe(false);
    expect(isCronAuthorized(request({ authorization: "Bearer wrong" }), secret)).toBe(false);
    expect(isCronAuthorized(request({ authorization: "secret" }), secret)).toBe(false);
    expect(isCronAuthorized(request({ authorization: "Bearer secret" }), secret)).toBe(true);
    expect(isCronAuthorized(request({ authorization: "bearer secret" }), secret)).toBe(true);
    expect(isCronAuthorized(request({ cronHeader: secret }), secret)).toBe(true);
    expect(isCronAuthorized(request({ key: secret }), secret)).toBe(true);
    expect(isCronAuthorized(request({ key: "nope" }), secret)).toBe(false);
  });
});

describe("dispatch settings cache", () => {
  it("reuses the in-memory value until the cache is cleared", async () => {
    await Setting.create({
      acceptedPaymentMethods: ["card"],
      dispatchAssigneeMode: "exclusive",
      stripeCurrency: "eur",
    });
    clearPartnerDispatchSettingsCache();

    const first = await getPartnerDispatchSettings();
    await Setting.updateOne({}, { dispatchAssigneeMode: "allow_both" });
    const cached = await getPartnerDispatchSettings();
    clearPartnerDispatchSettingsCache();
    const fresh = await getPartnerDispatchSettings();

    expect(first.dispatchAssigneeMode).toBe("exclusive");
    expect(cached.dispatchAssigneeMode).toBe("exclusive");
    expect(fresh.dispatchAssigneeMode).toBe("allow_both");
  });
});
