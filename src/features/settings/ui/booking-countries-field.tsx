"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { apiGet } from "@/shared/http/api";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";

export function BookingCountriesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (countries: string[]) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const locale = useLocale();
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiGet<{
          success: boolean;
          data: { countries: string[] };
        }>("/api/settings/booking-countries");
        if (!cancelled) setCountries(data.data.countries);
      } catch {
        if (!cancelled) setCountries([]);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // The browser localises the names, so no country data ships in the bundle.
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  const sortedCountries = useMemo(() => {
    const label = (code: string) => regionNames?.of(code) ?? code;
    return [...countries].sort((a, b) => label(a).localeCompare(label(b)));
  }, [countries, regionNames]);

  const filteredCountries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sortedCountries;

    return sortedCountries.filter((code) => {
      const name = (regionNames?.of(code) ?? code).toLowerCase();
      return name.includes(needle) || code.toLowerCase().includes(needle);
    });
  }, [sortedCountries, query, regionNames]);

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (code: string) => {
    const next = new Set(value);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    onChange([...next].sort());
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("booking-countries-help")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          id="booking-countries-search"
          type="search"
          autoComplete="off"
          className="max-w-xs"
          value={query}
          aria-label={t("booking-countries-search")}
          placeholder={t("booking-countries-search")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {value.length === 0
            ? t("booking-countries-all-allowed")
            : t("booking-countries-selected-count", { count: value.length })}
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border border-border p-1.5">
        {filteredCountries.map((code) => (
          <label
            key={code}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.has(code)}
              onCheckedChange={() => toggle(code)}
            />
            <span className="min-w-0 flex-1 truncate">
              {regionNames?.of(code) ?? code}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {code}
            </span>
          </label>
        ))}
        {filteredCountries.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {t("booking-countries-no-results")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
