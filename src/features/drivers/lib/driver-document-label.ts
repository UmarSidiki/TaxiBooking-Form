import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"Driver">>;

export function driverDocumentLabel(t: Translator, type: string) {
  if (type === "license") return t("doc-license");
  if (type === "id") return t("doc-id");
  if (type === "insurance") return t("doc-insurance");
  if (type === "registration") return t("doc-registration");
  if (type === "other") return t("doc-other");
  return type;
}

export function driverStatusLabel(t: Translator, status: string | undefined) {
  if (status === "pending") return t("status-pending");
  if (status === "rejected") return t("status-rejected");
  return t("status-approved");
}
