import { headers } from "next/headers";

import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { SettingsPageAppearance } from "@/features/settings/ui/settings-page-appearance";
import { detectRequestBaseUrl } from "@/shared/lib/resolve-public-url";

export default async function SettingsAppearanceRoute() {
  const requestHeaders = await headers();
  const detectedPublicUrl =
    detectRequestBaseUrl(requestHeaders) ??
    (await resolvePublicUrl({ request: requestHeaders }));

  return <SettingsPageAppearance detectedPublicUrl={detectedPublicUrl} />;
}
