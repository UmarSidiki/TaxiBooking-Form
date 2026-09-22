import Image from "next/image";

import { cn } from "@/shared/lib/utils";

export function DeskMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative size-9 shrink-0 overflow-hidden rounded-md bg-card ring-1 ring-border",
        className
      )}
    >
      <Image
        src="/icon.png"
        alt=""
        fill
        sizes="36px"
        className="origin-[center_37%] scale-[2.7] object-cover"
      />
    </div>
  );
}
