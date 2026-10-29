import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import { isValidEmail, isValidPhone } from "@/shared/lib/validation";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

/** Cheap render-time gate for enabling the payment buttons. */
export function isStep3ContactValid(formData: FormData): boolean {
  return Boolean(
    formData.firstName.trim() &&
      formData.lastName.trim() &&
      isValidEmail(formData.email) &&
      isValidPhone(formData.phone)
  );
}

export function validateStep3Contact(
  formData: FormData,
  t: ReturnType<typeof useTranslations>,
  setErrors: Dispatch<SetStateAction<FormErrors>>
): boolean {
  const newErrors: FormErrors = {};
  if (!formData.firstName.trim())
    newErrors.firstName = t("Step3.first-name-is-required");
  if (!formData.lastName.trim()) newErrors.lastName = t("Step3.last-name-is-required");
  if (!formData.email.trim()) newErrors.email = t("Step3.email-is-required");
  if (!formData.phone.trim()) newErrors.phone = t("Step3.phone-is-required");

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return false;
  }
  return true;
}
