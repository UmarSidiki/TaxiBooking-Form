import type { ReactNode } from "react";

type ContactPart =
  | { kind: "text"; value: string }
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

const CONTACT =
  /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|((?:\+|00)\d(?:[\s().-]*\d){7,14}|\b0\d(?:[\s().-]*\d){7,12}\b)/g;

const linkClass =
  "underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm";

/** Splits emails and phone numbers out of operator-written text. Plain text stays plain. */
export function splitContactText(text: string): ContactPart[] {
  const parts: ContactPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(CONTACT)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      parts.push({ kind: "text", value: text.slice(cursor, index) });
    }
    if (match[1]) parts.push({ kind: "email", value: match[1] });
    else if (match[2]) parts.push({ kind: "phone", value: match[2] });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push({ kind: "text", value: text.slice(cursor) });
  if (parts.length === 0) parts.push({ kind: "text", value: text });
  return parts;
}

function telHref(phone: string) {
  const compact = phone.replace(/[^\d+]/g, "");
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
}

function stopPreviewClick(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/** Renders text as-is, with any email or phone number as a link. */
export function LinkifiedText({ text }: { text: string }) {
  const parts = splitContactText(text);
  return parts.map((part, index) => renderPart(part, index));
}

function renderPart(part: ContactPart, index: number): ReactNode {
  if (part.kind === "email") {
    return (
      <a
        key={index}
        href={`mailto:${part.value}`}
        className={linkClass}
        onClick={stopPreviewClick}
        onPointerDown={stopPreviewClick}
      >
        {part.value}
      </a>
    );
  }
  if (part.kind === "phone") {
    return (
      <a
        key={index}
        href={`tel:${telHref(part.value)}`}
        className={linkClass}
        onClick={stopPreviewClick}
        onPointerDown={stopPreviewClick}
      >
        {part.value}
      </a>
    );
  }
  return <span key={index}>{part.value}</span>;
}
