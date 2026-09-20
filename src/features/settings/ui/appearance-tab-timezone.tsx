"use client";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";

export function AppearanceTimezoneField({
  value,
  onChange,
  label,
  help,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  help: string;
}) {
  const timezones = Intl.supportedValuesOf("timeZone");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <DeskSelect
        ariaLabel={label}
        value={value}
        onValueChange={onChange}
        options={timezones.map((tz) => ({
          value: tz,
          label: tz.replace(/_/g, " "),
        }))}
      />
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
}
