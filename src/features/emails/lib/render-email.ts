import type { ReactElement } from "react";
import { render, toPlainText } from "@react-email/render";

export type RenderedEmail = { html: string; text: string };

/**
 * Renders a React Email component to HTML and a plain-text alternative.
 * Extra links are appended so the text version never loses a CTA URL.
 */
export async function renderEmail(
  element: ReactElement,
  links: Array<string | null | undefined> = [],
): Promise<RenderedEmail> {
  const html = await render(element);
  const body = await toPlainText(html);
  const extra = links
    .map((link) => link?.trim())
    .filter((link): link is string => Boolean(link));
  return {
    html,
    text: extra.length ? `${body}\n\n${extra.join("\n")}` : body,
  };
}
