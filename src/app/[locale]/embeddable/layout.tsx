"use client";

export default function EmbeddableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Embeddable forms are always accessible
  // Feature flag only controls sidebar visibility
  return <>{children}</>;
}
