import React from "react";
import "@/style/EmbeddableLayout.css"

export default function EmbeddableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="transparent-background">{children}</div>;
}