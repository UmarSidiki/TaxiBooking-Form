"use client";

import * as React from "react";
import { memo } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { Globe } from "lucide-react";

function LanguageSwitcherComponent() {
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
        <Button
          variant="outline"
          size="default"
          disabled={isPending}
          className="h-10 min-w-10 gap-2 px-3 bg-[var(--sheet)] border-[var(--rule2)]"
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.keys(languages).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onSelectLocale(lang)}
            className={`cursor-pointer py-2 px-3 ${locale === lang ? "font-semibold" : "font-normal"}`}
            aria-current={locale === lang}
          >
            <div className="flex items-center justify-between w-full gap-3">
              <span>{languages[lang].name}</span>
              <span className="text-xs font-mono text-muted-foreground">{languages[lang].code}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const LanguageSwitcher = memo(LanguageSwitcherComponent);
