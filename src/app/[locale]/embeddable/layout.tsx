/** Embeds read the operator's palette tokens (riviera-palettes.css) from the first paint. */
export default function EmbeddableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="riviera-embed">{children}</div>;
}
