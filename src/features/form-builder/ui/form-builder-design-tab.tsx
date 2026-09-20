"use client";

import { FormBuilderDesignButtonFooter } from "@/components/form-builder/form-builder-design-button-footer";
import { FormBuilderDesignColors } from "@/components/form-builder/form-builder-design-colors";
import { FormBuilderDesignHeader } from "@/components/form-builder/form-builder-design-header";
import { FormBuilderDesignLayout } from "@/components/form-builder/form-builder-design-layout";
import type { FormBuilderStyleEditorProps } from "@/components/form-builder/form-builder-style-editor-props";
import { Separator } from "@/components/ui/separator";

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
