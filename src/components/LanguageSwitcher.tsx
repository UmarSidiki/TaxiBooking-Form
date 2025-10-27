"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Globe } from "lucide-react";

export function LanguageSwitcher() {
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

  const languages: { [key: string]: string } = {
    en: "English",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    nl: "Nederlands",
    it: "Italiano",
    ru: "Русский",
    ar: "العربية"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          disabled={isPending}
          className="max-w-[200px] h-12 justify-start gap-3 px-4 bg-background hover:bg-accent border-border/50"
          aria-label="Switch Language"
        >
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-medium">{languages[locale]}</span>
          <div className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {locale.toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {Object.keys(languages).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onSelectLocale(lang)}
            disabled={locale === lang ? true : false}
            className={`cursor-pointer py-3 px-4 ${
              locale === lang ? "bg-accent font-semibold" : "font-normal"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span>{languages[lang]}</span>
              {locale === lang && (
                <div className="h-2 w-2 bg-primary rounded-full"></div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
