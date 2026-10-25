import { connectDB } from "@/shared/db/mongoose";
import { Booking } from "@/features/booking/model";
import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { Partner, PartnerSettlementEntry } from "@/features/partners/model";
import { clearPartnerDispatchSettingsCache } from "@/features/partners/lib/get-partner-dispatch-settings";
import { Review } from "@/features/reviews/model";
import { Setting } from "@/features/settings/model";

export async function resetTestDb() {
  await connectDB();
  clearPartnerDispatchSettingsCache();
  await Promise.all([
    Booking.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Partner.deleteMany({}),
    PartnerSettlementEntry.deleteMany({}),
    Review.deleteMany({}),
    Setting.deleteMany({}),
  ]);
}
