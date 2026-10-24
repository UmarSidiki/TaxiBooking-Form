import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { aggregateDashboardStats } from "@/features/dashboard/lib/aggregate-dashboard-stats";
import { legacyDashboardStats } from "@/features/dashboard/lib/legacy-dashboard-stats";
import { sendPickupReminders } from "@/features/booking/lib/send-pickup-reminders";
import { Driver } from "@/features/drivers/model";
import { deliverAssigneeNotice, type OutboundText } from "@/features/settings/lib/assignee-whatsapp";
import { Setting } from "@/features/settings/model";
import { createDriver, createRide, createVehicle, saveDispatchSettings } from "./helpers/fixtures";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function sender(store: OutboundText[][]) {
  return async (messages: OutboundText[]) => {
    store.push(messages);
    return { ok: true as const };
  };
}

describe("assignee WhatsApp", () => {
  it("sends the assigned template to the assignee phone", async () => {
    await saveDispatchSettings({});
    await Setting.updateOne({}, { $set: { whatsappTplAssigned: true } });
    const sent: OutboundText[][] = [];
    const result = await deliverAssigneeNotice(
      {
        kind: "assigned",
        recipients: [{ phone: "+1 415 555 2671", name: "Nia" }],
        ride: { tripId: "T1", pickup: "Airport", date: "2026-06-20", time: "09:00" },
      },
      { linked: async () => true, send: sender(sent) },
    );
    expect(result.reason).toBe("sent");
    expect(sent).toEqual([[{
      jid: "14155552671@s.whatsapp.net",
      text: "Ride T1 is assigned to you. Airport on 2026-06-20 at 09:00.",
    }]]);
  });

  it("batches every eligible partner into one send", async () => {
    await saveDispatchSettings({});
    await Setting.updateOne({}, { $set: { whatsappTplAvailable: true } });
    const sent: OutboundText[][] = [];
    await deliverAssigneeNotice(
      {
        kind: "available",
        recipients: [{ phone: "+14155552671" }, { phone: "+447911123456" }, { phone: "" }],
        ride: { tripId: "T2", pickup: "Station", date: "2026-06-21", time: "11:00" },
      },
      { linked: async () => true, send: sender(sent) },
    );
    expect(sent[0]?.map((message) => message.jid)).toEqual([
      "14155552671@s.whatsapp.net",
      "447911123456@s.whatsapp.net",
    ]);
    expect(sent[0]?.[0]?.text).toContain("available to claim");
  });

  it("does not send when the toggle is off, WhatsApp is unlinked, or there is no phone", async () => {
    await saveDispatchSettings({});
    const sent: OutboundText[][] = [];
    const send = sender(sent);
    const ride = { tripId: "T3", pickup: "Dock", date: "2026-06-22", time: "08:00" };
    expect((await deliverAssigneeNotice({ kind: "cancelled", recipients: [{ phone: "+14155552671" }], ride }, { linked: async () => true, send })).reason).toBe("toggle_off");
    await Setting.updateOne({}, { $set: { whatsappTplChanged: true, whatsappTplSettlement: true } });
    expect((await deliverAssigneeNotice({ kind: "cancelled", recipients: [{ phone: "+14155552671" }], ride }, { linked: async () => false, send })).reason).toBe("not_linked");
    expect((await deliverAssigneeNotice({ kind: "settlement", recipients: [{ phone: null }], amount: 20, currency: "eur" }, { linked: async () => true, send })).reason).toBe("no_phone");
    expect(sent).toHaveLength(0);
  });

  it("logs a failed send without throwing", async () => {
    await saveDispatchSettings({});
    await Setting.updateOne({}, { $set: { whatsappTplSettlement: true } });
    const result = await deliverAssigneeNotice(
      { kind: "settlement", recipients: [{ phone: "+14155552671" }], amount: 12.5, currency: "eur" },
      { linked: async () => true, send: async () => { throw new Error("socket down"); } },
    );
    expect(result.reason).toBe("failed");
  });
});

describe("pickup reminders", () => {
  it("sends once for a ride in the next day and skips the second run", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    await Driver.updateOne({ _id: driver._id }, { $set: { phone: "+14155552671" } });
    await saveDispatchSettings({});
    await Setting.updateOne({}, { $set: { whatsappTplReminder: true, timezone: "UTC" } });
    await createRide({
      selectedVehicle: vehicle._id,
      date: "2026-06-15",
      time: "18:00",
      status: "upcoming",
      pickup: "Harbor",
      assignedDriver: { _id: driver._id, name: driver.name, email: driver.email },
    });
    const sent: OutboundText[][] = [];
    const first = await sendPickupReminders(NOW, { linked: async () => true, send: sender(sent) });
    const second = await sendPickupReminders(NOW, { linked: async () => true, send: sender(sent) });
    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.[0]?.text).toContain("Pickup reminder");
    expect(sent[0]?.[0]?.jid).toBe("14155552671@s.whatsapp.net");
    const stored = await Booking.findOne({ pickup: "Harbor" });
    expect(stored?.pickupReminderSent).toBe(true);
  });
});

describe("dashboard stats aggregation", () => {
  it("matches the previous totals for UTC and Europe/Zurich", async () => {
    const vehicle = await createVehicle();
    const samples = [
      { date: "2026-06-02", time: "09:00", status: "upcoming", paymentStatus: "completed", dropoff: "Airport", totalAmount: 100 },
      { date: "2026-06-20", time: "18:00", status: "upcoming", paymentStatus: "completed", dropoff: "Airport", totalAmount: 50 },
      { date: "2026-05-10", time: "11:00", status: "completed", paymentStatus: "completed", dropoff: "Station", totalAmount: 80 },
      { date: "2026-06-10", time: "08:00", status: "upcoming", paymentMethod: "cash", dropoff: "Harbor", totalAmount: 40 },
      { date: "2026-06-12", time: "12:00", status: "canceled", paymentStatus: "completed", dropoff: "Harbor", totalAmount: 70 },
    ];
    for (const [index, sample] of samples.entries()) {
      await createRide({
        ...sample,
        selectedVehicle: vehicle._id,
        tripId: `stats-${index}`,
        createdAt: new Date(Date.UTC(2026, 5, index + 1)),
      });
    }
    const stored = await Booking.find({}).lean();
    for (const timeZone of ["UTC", "Europe/Zurich"]) {
      const legacy = legacyDashboardStats(stored, NOW, timeZone);
      const actual = await aggregateDashboardStats(NOW, timeZone);
      expect(actual.totalBookings).toBe(legacy.totalBookings);
      expect(actual.completedBookings).toBe(legacy.completedBookings);
      expect(actual.upcomingBookings).toBe(legacy.upcomingBookings);
      expect(actual.canceledBookings).toBe(legacy.canceledBookings);
      expect(actual.totalRevenue).toBe(legacy.totalRevenue);
      expect(actual.monthlyRevenue).toBe(legacy.monthlyRevenue);
      expect(actual.monthlyBookings).toBe(legacy.monthlyBookings);
      expect(actual.monthlyChange).toBe(legacy.monthlyChange);
      expect(actual.topDestinations).toEqual(legacy.topDestinations);
    }
  });
});
