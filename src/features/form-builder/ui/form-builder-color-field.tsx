"use client";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function FormBuilderColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <Input
          aria-label={label}
          className="h-11 flex-1 font-mono text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
