"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Check, Copy } from "lucide-react";

export function EmbedFormPreview({
  previewLabel,
  path,
  showCode,
  snippet,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
}: {
  previewLabel: string;
  path: string;
  showCode: boolean;
  snippet: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="desk-card overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2 text-xs text-muted-foreground">
          {previewLabel}
        </div>
        <iframe
          src={path}
          className="h-[600px] w-full bg-background"
          title={previewLabel}
          allow="payment *"
        />
      </div>
      {showCode ? (
        <Card className="desk-card border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-mono text-xs text-muted-foreground">snippet.js</span>
            <Button size="sm" variant="outline" className="h-11" onClick={onCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? copiedLabel : copyLabel}
            </Button>
          </div>
          <CardContent className="p-0">
            <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs text-foreground">
              <code>{snippet}</code>
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
