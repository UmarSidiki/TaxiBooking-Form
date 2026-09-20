"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export function FleetImageSuggestions({
  currentValue,
  onSelect,
}: {
  currentValue: string;
  onSelect: (img: string) => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [query, setQuery] = useState(currentValue || "");

  useEffect(() => setQuery(currentValue || ""), [currentValue]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/fleet-images");
        const json = await res.json();
        if (!mounted) return;
        if (json && json.success && Array.isArray(json.data)) {
          setImages(json.data);
        }
      } catch (err) {
        console.warn("Failed to fetch fleet images", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!query) return images.slice(0, 12);
    return images.filter((i) => i.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  }, [images, query]);

  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {suggestions.map((img) => (
          <button
            type="button"
            key={img}
            onClick={() => onSelect(img)}
            className="group flex flex-col items-start text-left text-xs"
            title={img}
          >
            <div className="relative w-full h-14 bg-muted rounded overflow-hidden">
              <Image src={img} alt={img} fill unoptimized className="object-cover" />
            </div>
            <div className="truncate w-full mt-1 text-xxs text-muted-foreground">{img.replace(/^\//, "")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
