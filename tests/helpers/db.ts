import { connectDB } from "@/shared/db/mongoose";
import { Booking } from "@/features/booking/model";
import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { Partner, PartnerSettlementEntry } from "@/features/partners/model";
import { clearPartnerDispatchSettingsCache } from "@/features/partners/lib/get-partner-dispatch-settings";
import { clearPromoAvailabilityCache } from "@/features/pricing/lib/is-promo-available";
import { Review } from "@/features/reviews/model";
import CronMarker from "@/features/cron/model/CronMarker";
import PricingRule from "@/features/pricing/model/PricingRule";
import PromoCode from "@/features/pricing/model/PromoCode";
import PromoRedemption from "@/features/pricing/model/PromoRedemption";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CorporateAccount from "@/features/corporate/model/CorporateAccount";
import RecurringRide from "@/features/corporate/model/RecurringRide";
import RideCharge from "@/features/invoices/model/RideCharge";
import {
  Setting,
  WhatsAppConfig,
  WhatsAppDelivery,
  WhatsAppTemplate,
} from "@/features/settings/model";
import NotificationSetting from "@/features/notifications/model/NotificationSetting";

export async function resetTestDb() {
  await connectDB();
  clearPartnerDispatchSettingsCache();
  clearPromoAvailabilityCache();
  await Promise.all([
    Booking.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Partner.deleteMany({}),
    PartnerSettlementEntry.deleteMany({}),
    Review.deleteMany({}),
    Setting.deleteMany({}),
    CronMarker.deleteMany({}),
    PricingRule.deleteMany({}),
    PromoCode.deleteMany({}),
    PromoRedemption.deleteMany({}),
    CustomerOtp.deleteMany({}),
    CorporateAccount.deleteMany({}),
    RecurringRide.deleteMany({}),
    RideCharge.deleteMany({}),
    NotificationSetting.deleteMany({}),
    WhatsAppConfig.deleteMany({}),
    WhatsAppTemplate.deleteMany({}),
    WhatsAppDelivery.deleteMany({}),
  ]);
}
