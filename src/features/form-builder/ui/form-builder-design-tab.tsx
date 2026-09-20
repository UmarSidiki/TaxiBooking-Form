"use client";

import { FormBuilderDesignButtonFooter } from "@/features/form-builder/ui/form-builder-design-button-footer";
import { FormBuilderDesignColors } from "@/features/form-builder/ui/form-builder-design-colors";
import { FormBuilderDesignHeader } from "@/features/form-builder/ui/form-builder-design-header";
import { FormBuilderDesignLayout } from "@/features/form-builder/ui/form-builder-design-layout";
import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Separator } from "@/shared/ui/separator";

export function FormBuilderDesignTab(props: FormBuilderStyleEditorProps) {
  return (
    <div className="space-y-6">
      <FormBuilderDesignLayout {...props} />
      <Separator />
      <FormBuilderDesignHeader {...props} />
      <Separator />
      <FormBuilderDesignColors {...props} />
      <Separator />
      <FormBuilderDesignButtonFooter {...props} />
    </div>
  );
}
