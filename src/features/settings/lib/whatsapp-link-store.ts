import { connectDB } from "@/shared/db";
import WhatsAppLink, { type WhatsAppLinkStatus } from "@/features/settings/model/WhatsAppLink";

const LINK_ID = "desk";
const FRESH_MS = 70_000;

export type StoredWhatsAppLink = {
  status: WhatsAppLinkStatus;
  qrDataUrl: string | null;
  updatedAt: number;
};

export async function readWhatsAppLink(): Promise<StoredWhatsAppLink | null> {
  await connectDB();
  const doc = await WhatsAppLink.findById(LINK_ID).lean<{
    status: WhatsAppLinkStatus;
    qrDataUrl?: string | null;
    updatedAt?: Date;
  }>();
  if (!doc) return null;
  return {
    status: doc.status,
    qrDataUrl: doc.qrDataUrl ?? null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0,
  };
}

export function isFreshLink(link: StoredWhatsAppLink) {
  return Date.now() - link.updatedAt < FRESH_MS;
}

export async function writeWhatsAppLink(status: WhatsAppLinkStatus, qrDataUrl: string | null) {
  await connectDB();
  await WhatsAppLink.findByIdAndUpdate(
    LINK_ID,
    { $set: { status, qrDataUrl } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function clearWhatsAppLink() {
  await connectDB();
  await WhatsAppLink.deleteMany({});
}
