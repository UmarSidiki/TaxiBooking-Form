"use client";

import FormBuilderGuard from "@/features/form-builder/ui/form-builder-guard";
import { FormBuilderPage } from "@/features/form-builder/ui/form-builder-page";

export default function WrappedFormBuilderPage() {
  return (
    <FormBuilderGuard>
      <FormBuilderPage />
    </FormBuilderGuard>
  );
}
