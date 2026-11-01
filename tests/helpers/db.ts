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
import CustomerPhoneOtp from "@/features/customers/model/CustomerPhoneOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerSession from "@/features/customers/model/CustomerSession";
import CustomerLoginToken from "@/features/customers/model/CustomerLoginToken";
import { CustomerStats } from "@/features/customers-admin/model";
import AdminNote from "@/features/customers-admin/model/AdminNote";
import AdminAuditLog from "@/features/customers-admin/model/AdminAuditLog";
import CorporateAccount from "@/features/corporate/model/CorporateAccount";
import RecurringRide from "@/features/corporate/model/RecurringRide";
import RideCharge from "@/features/invoices/model/RideCharge";
import {
  Setting,
  WhatsAppConfig,
  WhatsAppDelivery,
  WhatsAppSendLog,
  WhatsAppTemplate,
} from "@/features/settings/model";
import NotificationSetting from "@/features/notifications/model/NotificationSetting";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import Suppression from "@/features/marketing/model/Suppression";
import Segment from "@/features/marketing/model/Segment";
import CampaignTemplate from "@/features/marketing/model/CampaignTemplate";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import ClickEvent from "@/features/marketing/model/ClickEvent";

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
    CustomerPhoneOtp.deleteMany({}),
    CustomerProfile.deleteMany({}),
    CustomerSession.deleteMany({}),
    CustomerLoginToken.deleteMany({}),
    CustomerStats.deleteMany({}),
    AdminNote.deleteMany({}),
    AdminAuditLog.deleteMany({}),
    CorporateAccount.deleteMany({}),
    RecurringRide.deleteMany({}),
    RideCharge.deleteMany({}),
    NotificationSetting.deleteMany({}),
    MarketingConsent.deleteMany({}),
    Suppression.deleteMany({}),
    Segment.deleteMany({}),
    CampaignTemplate.deleteMany({}),
    Campaign.deleteMany({}),
    CampaignRecipient.deleteMany({}),
    ClickEvent.deleteMany({}),
    WhatsAppConfig.deleteMany({}),
    WhatsAppTemplate.deleteMany({}),
    WhatsAppDelivery.deleteMany({}),
    WhatsAppSendLog.deleteMany({}),
  ]);
}
