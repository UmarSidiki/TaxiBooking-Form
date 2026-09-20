import Stripe from "stripe";
import type { NextRequest } from "next/server";

const registeredDomains = new Set<string>();

export async function registerPaymentMethodDomain(
  stripe: Stripe,
  request: NextRequest
) {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const domain = host?.split(":")[0]?.toLowerCase();
  if (!domain || domain === "localhost" || domain.endsWith(".local")) {
    return;
  }
  if (registeredDomains.has(domain)) {
    return;
  }

  try {
    await stripe.paymentMethodDomains.create({ domain_name: domain });
    registeredDomains.add(domain);
  } catch (error) {
    registeredDomains.add(domain);
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code !== "resource_already_exists"
    ) {
      console.warn(
        "Could not register Stripe payment method domain:",
        error.code
      );
    }
  }
}
