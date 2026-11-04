import { z } from "zod";

/** Kept in sync with `src/shared/i18n/routing.ts`. */
export const CUSTOMER_LOCALES = [
  "en",
  "fr",
  "es",
  "de",
  "nl",
  "it",
  "ru",
  "ar",
] as const;

export const customerSortSchema = z.enum([
  "name",
  "email",
  "rides",
  "spend",
  "last-ride",
  "created",
]);

export const customerSortDirectionSchema = z.enum(["asc", "desc"]);

const numberParam = (max: number) =>
  z.coerce.number().min(0).max(max).optional();

export const customerListQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  ridesMin: numberParam(1_000_000),
  ridesMax: numberParam(1_000_000),
  spendMin: numberParam(10_000_000),
  spendMax: numberParam(10_000_000),
  lastRide: z.enum(["any", "within", "before", "never"]).default("any"),
  lastRideDays: z.coerce.number().int().min(1).max(3650).default(30),
  verifiedWhatsApp: z.enum(["any", "yes", "no"]).default("any"),
  emailConsent: z.enum(["any", "granted", "none"]).default("any"),
  whatsappConsent: z.enum(["any", "granted", "none"]).default("any"),
  locale: z.enum(["any", ...CUSTOMER_LOCALES]).default("any"),
  upcoming: z.enum(["any", "yes", "no"]).default("any"),
  sort: customerSortSchema.default("last-ride"),
  dir: customerSortDirectionSchema.default("desc"),
  cursor: z.string().max(400).optional(),
});

export type CustomerListParams = z.infer<typeof customerListQuerySchema>;
export type CustomerSort = z.infer<typeof customerSortSchema>;
export type CustomerSortDirection = z.infer<typeof customerSortDirectionSchema>;

export const DEFAULT_CUSTOMER_LIST_PARAMS: CustomerListParams =
  customerListQuerySchema.parse({});

export function countActiveCustomerFilters(params: CustomerListParams): number {
  let count = 0;
  if (params.ridesMin !== undefined) count += 1;
  if (params.ridesMax !== undefined) count += 1;
  if (params.spendMin !== undefined) count += 1;
  if (params.spendMax !== undefined) count += 1;
  if (params.lastRide !== "any") count += 1;
  if (params.verifiedWhatsApp !== "any") count += 1;
  if (params.emailConsent !== "any") count += 1;
  if (params.whatsappConsent !== "any") count += 1;
  if (params.locale !== "any") count += 1;
  if (params.upcoming !== "any") count += 1;
  return count;
}

/** Client-side query string for GET /api/admin/customers. Defaults are omitted. */
export function toCustomerListSearchString(params: CustomerListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.ridesMin !== undefined) search.set("ridesMin", String(params.ridesMin));
  if (params.ridesMax !== undefined) search.set("ridesMax", String(params.ridesMax));
  if (params.spendMin !== undefined) search.set("spendMin", String(params.spendMin));
  if (params.spendMax !== undefined) search.set("spendMax", String(params.spendMax));
  if (params.lastRide !== "any") search.set("lastRide", params.lastRide);
  if (params.lastRide !== "any" && params.lastRide !== "never") {
    search.set("lastRideDays", String(params.lastRideDays));
  }
  if (params.verifiedWhatsApp !== "any") {
    search.set("verifiedWhatsApp", params.verifiedWhatsApp);
  }
  if (params.emailConsent !== "any") search.set("emailConsent", params.emailConsent);
  if (params.whatsappConsent !== "any") {
    search.set("whatsappConsent", params.whatsappConsent);
  }
  if (params.locale !== "any") search.set("locale", params.locale);
  if (params.upcoming !== "any") search.set("upcoming", params.upcoming);
  if (params.sort !== "last-ride") search.set("sort", params.sort);
  if (params.dir !== "desc") search.set("dir", params.dir);
  if (params.cursor) search.set("cursor", params.cursor);
  return search.toString();
}
