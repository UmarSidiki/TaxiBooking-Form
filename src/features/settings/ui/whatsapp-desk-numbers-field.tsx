"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const MAX_NUMBERS = 5;

export function WhatsAppDeskNumbersField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const numbers = value.length > 0 ? value : [""];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{t("whatsapp_notify")}</legend>
      <p className="text-xs text-muted-foreground">{t("whatsapp_notify_help")}</p>
      {numbers.map((number, index) => (
        <div key={index} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`whatsapp-desk-${index}`}>
            {t("whatsapp_number_label")} {index + 1}
          </label>
          <Input
            id={`whatsapp-desk-${index}`}
            name={`deskNumber-${index}`}
            type="tel"
            autoComplete="tel"
            spellCheck={false}
            translate="no"
            value={number}
            onChange={(event) =>
              onChange(
                numbers.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0"
            onClick={() => onChange(numbers.filter((_, itemIndex) => itemIndex !== index))}
            disabled={numbers.length === 1 && number === ""}
          >
            {t("whatsapp_remove_number")}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-fit"
        disabled={numbers.length >= MAX_NUMBERS}
        onClick={() => onChange([...numbers, ""])}
      >
        {t("whatsapp_add_number")}
      </Button>
    </fieldset>
  );
}
