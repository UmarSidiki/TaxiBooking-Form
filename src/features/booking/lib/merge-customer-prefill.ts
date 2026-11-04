import type { CustomerPrefill } from "@/features/booking/schema/customer-prefill.schema";

export type CustomerPrefillTarget = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
};

const DEFAULT_WHATSAPP_OPT_IN = true;

function isBlank(value: string | undefined) {
  return !value || value.trim() === "";
}

/** A dial code on its own ("+41 ") is not a real number yet. */
function isDialCodeOnly(value: string) {
  return /^\+\d{1,4}\s*$/.test(value.trim());
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Fill only empty contact fields from the signed-in customer. Anything the
 * visitor already typed wins, and an unverified phone is never used.
 */
export function mergeCustomerPrefill<T extends CustomerPrefillTarget>(
  formData: T,
  customer: CustomerPrefill | null | undefined,
): T {
  if (!customer) return formData;

  const patch: Partial<CustomerPrefillTarget> = {};
  const { firstName, lastName } = splitName(customer.name);

  if (isBlank(formData.firstName) && firstName) patch.firstName = firstName;
  if (isBlank(formData.lastName) && lastName) patch.lastName = lastName;
  if (isBlank(formData.email) && !isBlank(customer.email)) {
    patch.email = customer.email.trim();
  }

  const verifiedPhone = (customer.verifiedPhone ?? "").trim();
  if (!isBlank(formData.phone) && !isDialCodeOnly(formData.phone)) {
    // Keep what the visitor typed.
  } else if (verifiedPhone) {
    patch.phone = verifiedPhone;
  }

  const whatsappOptIn = customer.preferences?.whatsappOptIn;
  if (
    typeof whatsappOptIn === "boolean" &&
    formData.whatsappOptIn === DEFAULT_WHATSAPP_OPT_IN &&
    whatsappOptIn !== formData.whatsappOptIn
  ) {
    patch.whatsappOptIn = whatsappOptIn;
  }

  if (Object.keys(patch).length === 0) return formData;
  return { ...formData, ...patch };
}
