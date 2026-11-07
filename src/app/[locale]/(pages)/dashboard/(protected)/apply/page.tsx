import { headers } from "next/headers";

import { EmbedFormsPage } from "@/features/form-builder/ui/embed-forms-page";
import EmbedFormsGuard from "@/features/form-builder/ui/embed-forms-guard";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

export default async function ApplyPage() {
  const baseUrl = await resolvePublicUrl({ request: await headers() });

  return (
    <EmbedFormsGuard>
      <EmbedFormsPage baseUrl={baseUrl} />
    </EmbedFormsGuard>
  );
}
