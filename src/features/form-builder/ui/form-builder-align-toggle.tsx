"use client";

import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";

type Align = "left" | "center" | "right";

export function FormBuilderAlignToggle({
  value,
  onChange,
  t,
}: {
  value: Align;
  onChange: (align: Align) => void;
  t: FormBuilderStyleEditorProps["t"];
}) {
  const options: Align[] = ["left", "center", "right"];
  return (
    <div className="flex gap-1">
      {options.map((align) => (
        <button
          key={align}
          type="button"
          onClick={() => onChange(align)}
          aria-pressed={value === align}
          className={`min-h-11 flex-1 rounded-md text-xs font-medium transition-colors duration-200 ${
            value === align
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t(`ui.${align}`)}
        </button>
      ))}
    </div>
  );
}
