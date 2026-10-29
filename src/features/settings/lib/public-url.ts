import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import {
  detectRequestBaseUrl,
  resolvePublicUrl as resolvePublicUrlCore,
  shouldPersistPublicBaseUrl,
  type RequestHeadersLike,
} from "@/shared/lib/resolve-public-url";

export async function getPersistedPublicBaseUrl(): Promise<string | null> {
  try {
    await connectDB();
    const settings = await Setting.findOne().select("publicBaseUrl");
    return settings?.publicBaseUrl?.trim() || null;
  } catch (error) {
    console.error("Could not read the persisted public URL:", error);
    return null;
  }
}

/**
 * DB-aware resolver. Callers with a request get the detected host when it is
 * trusted; webhooks, cron jobs, invoices and outbox workers fall back to the
 * persisted setting.
 */
export async function resolvePublicUrl(
  input: { request?: RequestHeadersLike | null } = {}
): Promise<string | null> {
  const persistedBaseUrl = await getPersistedPublicBaseUrl();
  return resolvePublicUrlCore({ ...input, persistedBaseUrl });
}

export async function persistDetectedPublicBaseUrl(
  request?: RequestHeadersLike | null
): Promise<void> {
  const detected = detectRequestBaseUrl(request);
  if (!detected) return;

  await connectDB();
  const settings = await Setting.findOne();
  if (
    !shouldPersistPublicBaseUrl(detected, settings?.publicBaseUrl ?? null)
  ) {
    return;
  }

  if (settings) {
    settings.publicBaseUrl = detected;
    await settings.save();
    return;
  }

  await Setting.create({ publicBaseUrl: detected });
}
