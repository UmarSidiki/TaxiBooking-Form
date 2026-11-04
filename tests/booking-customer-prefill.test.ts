import { describe, expect, it } from "vitest";
import {
  mergeCustomerPrefill,
  type CustomerPrefillTarget,
} from "@/features/booking/lib/merge-customer-prefill";
import { fetchCustomerPrefill } from "@/features/booking/lib/fetch-customer-prefill";

function blankForm(): CustomerPrefillTarget {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsappOptIn: true,
  };
}

const ada = {
  email: "ada@example.com",
  name: "Ada Lovelace",
  verifiedPhone: "+41791234567",
  preferences: { whatsappOptIn: false },
};

describe("mergeCustomerPrefill", () => {
  it("fills empty contact fields and a saved preference", () => {
    const form = blankForm();
    const merged = mergeCustomerPrefill(form, ada);

    expect(merged).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+41791234567",
      whatsappOptIn: false,
    });
    expect(form).toEqual(blankForm());
  });

  it("does not overwrite anything the visitor typed", () => {
    const form: CustomerPrefillTarget = {
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      phone: "+41 79 000 00 00",
      whatsappOptIn: false,
    };

    expect(mergeCustomerPrefill(form, { ...ada, preferences: { whatsappOptIn: true } })).toBe(form);
  });

  it("ignores an unverified phone", () => {
    const merged = mergeCustomerPrefill(blankForm(), {
      email: "ada@example.com",
      name: "",
      verifiedPhone: "",
      preferences: {},
    });

    expect(merged.phone).toBe("");
    expect(merged.firstName).toBe("");
    expect(merged.lastName).toBe("");
  });

  it("replaces a dial-code-only phone with the verified number", () => {
    const merged = mergeCustomerPrefill({ ...blankForm(), phone: "+41 " }, ada);

    expect(merged.phone).toBe("+41791234567");
  });

  it("returns the form untouched when signed out", () => {
    const form = blankForm();

    expect(mergeCustomerPrefill(form, null)).toBe(form);
  });
});

describe("fetchCustomerPrefill", () => {
  it("returns null silently on a signed-out 401 without sending form data", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await expect(fetchCustomerPrefill(fetcher)).resolves.toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/account/me");
    expect(calls[0].init).toMatchObject({
      method: "GET",
      credentials: "same-origin",
    });
    expect(calls[0].init?.body).toBeUndefined();
  });

  it("returns null when the customer payload is malformed", async () => {
    const fetcher = (async () =>
      new Response(JSON.stringify({ email: "" }), { status: 200 })) as typeof fetch;

    await expect(fetchCustomerPrefill(fetcher)).resolves.toBeNull();
  });

  it("parses a signed-in customer", async () => {
    const fetcher = (async () =>
      new Response(JSON.stringify(ada), { status: 200 })) as typeof fetch;

    await expect(fetchCustomerPrefill(fetcher)).resolves.toEqual(ada);
  });
});
