"use client";

import * as React from "react";
import { memo } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { Check, Globe } from "lucide-react";

function LanguageSwitcherComponent({ menuSide = "bottom" }: { menuSide?: "top" | "bottom" }) {
  const [isPending, startTransition] = useTransition();

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectLocale = (nextLocale: string) => {
    startTransition(() => {
      // Replace the locale in the pathname
      const segments = pathname.split("/");
      if (segments.length > 1) {
        segments[1] = nextLocale;
      }
      const newPath = segments.join("/");
      router.replace(newPath);
    });
  };

  const languages: Record<string, { name: string; code: string }> = {
    en: { name: "English", code: "EN" },
    de: { name: "Deutsch", code: "DE" },
    fr: { name: "Français", code: "FR" },
    it: { name: "Italiano", code: "IT" },
    es: { name: "Español", code: "ES" },
    nl: { name: "Nederlands", code: "NL" },
    ru: { name: "Русский", code: "RU" },
    ar: { name: "العربية", code: "AR" },
  };

  const current = languages[locale] ?? languages.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="dock-btn dock-lang"
          aria-label={`Language: ${current.name}`}
        >
          <Globe aria-hidden="true" />
          <span>{current.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuSide === "top" ? "center" : "end"} side={menuSide} sideOffset={8} className="w-48 rounded-[var(--radius)] shadow-md">
        {Object.keys(languages).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onSelectLocale(lang)}
            className="cursor-pointer py-2 px-3"
            aria-current={locale === lang}
          >
            <div className="flex items-center justify-between w-full gap-3">
              <span>{languages[lang].name}</span>
              {locale === lang && <Check className="h-4 w-4" aria-hidden="true" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const LanguageSwitcher = memo(LanguageSwitcherComponent);
