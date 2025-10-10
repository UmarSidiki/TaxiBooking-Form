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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Switch Language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.keys(languages).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onSelectLocale(lang)}
            disabled={locale === lang ? true : false}
            className={`cursor-pointer ${
              locale === lang ? "font-semibold" : "font-normal"
            }`}
          >
            {languages[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
