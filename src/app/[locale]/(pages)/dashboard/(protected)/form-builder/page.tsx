"use client";

import FormBuilderGuard from "@/components/form-builder/FormBuilderGuard";
import { FormBuilderPage } from "@/components/form-builder/form-builder-page";

export default function WrappedFormBuilderPage() {
  return (
    <FormBuilderGuard>
      <FormBuilderPage />
    </FormBuilderGuard>
  );
}
