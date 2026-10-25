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
  it("fails closed when the secret is missing and checks the bearer token", () => {
    expect(isCronAuthorized("Bearer secret", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer secret", "")).toBe(false);
    expect(isCronAuthorized(null, "secret")).toBe(false);
    expect(isCronAuthorized("Bearer wrong", "secret")).toBe(false);
    expect(isCronAuthorized("secret", "secret")).toBe(false);
    expect(isCronAuthorized("Bearer secret", "secret")).toBe(true);
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
