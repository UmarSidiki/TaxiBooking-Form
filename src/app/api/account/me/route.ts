import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import {
  applyCustomerSessionCookie,
  readCustomerSession,
} from "@/features/customers/lib/customer-session";

type ProfileLean = {
  name?: string;
  verifiedPhone?: string;
  language?: string;
  whatsappOptIn?: boolean;
  savedAddresses?: { home?: string; work?: string; airport?: string };
};

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const session = await readCustomerSession(request);
  if (!session) return noStore(NextResponse.json({ error: "unauthorized" }, { status: 401 }));

  await connectDB();
  const profile = await CustomerProfile.findOne({ email: session.email }).lean<ProfileLean | null>();

  const response = NextResponse.json({
    email: session.email,
    name: profile?.name ?? "",
    verifiedPhone: profile?.verifiedPhone ?? "",
    language: profile?.language ?? "en",
    preferences: {
      whatsappOptIn: profile?.whatsappOptIn ?? true,
      savedAddresses: {
        home: profile?.savedAddresses?.home ?? "",
        work: profile?.savedAddresses?.work ?? "",
        airport: profile?.savedAddresses?.airport ?? "",
      },
    },
  });
  return applyCustomerSessionCookie(noStore(response), session);
}
