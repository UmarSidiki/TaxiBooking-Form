"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Check, 
  Eye, 
  Code, 
  Layers, 
  Zap, 
  Smartphone, 
  ExternalLink 
} from "lucide-react";

interface FormVariant {
  id: string;
  name: string;
  description: string;
  features: string[];
  path: string;
  icon: React.ReactNode;
}

export default function ApplyPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("v1");
  const [showCode, setShowCode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const formVariants: FormVariant[] = [
    {
      id: "v1",
      name: "Classic Form",
      description: "Full-featured booking with step indicators",
      features: ["Progress steps indicator", "One-way and round-trip", "Multiple stops support", "Interactive map"],
      path: "/embeddable/v1",
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: "v2",
      name: "Compact Form",
      description: "Streamlined design for essential booking",
      features: ["Simplified layout", "Space-efficient", "Essential fields only", "Fast loading"],
      path: "/embeddable/v2",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "v3",
      name: "Minimal Form",
      description: "Ultra-compact for sidebars and mobile",
      features: ["Minimalist design", "Mobile-optimized", "Quick flow", "Perfect for tight spaces"],
      path: "/embeddable/v3",
      icon: <Smartphone className="w-5 h-5" />,
    },
  ];

  const getEmbedScript = (variant: FormVariant) => {
    return `<div id="booking-widget-root"></div>
<script>
(function () {

  // ---- SANITIZER ----
  function sanitizeLang(lang) {
    let out = (lang || "en").split("-")[0].toLowerCase();
    if (!out || out === "auto" || out === "default") out = "en";
    return out;
  }

  // ---- CONFIG ----
  const CONFIG = {
    containerId: "booking-widget-root",
    base: "${baseUrl}",
    allowedOrigins: ["${baseUrl}"],
    buffer: 20,
    minHeight: 300,
    maxHeight: 2000,
    threshold: 10,
    animation: "height 260ms ease",
    initialLang: sanitizeLang(document.documentElement.lang)
  };

  const container = document.getElementById(CONFIG.containerId);
  if (!container) return;

  // ---- IFRAME SETUP ----
  const iframe = document.createElement("iframe");
  iframe.className = "booking-widget-iframe";
  iframe.width = "100%";
  iframe.style.border = "0";
  iframe.style.overflow = "hidden";
  iframe.style.transition = CONFIG.animation;
  iframe.style.minHeight = CONFIG.minHeight + "px";
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("title", "Interactive Booking Widget");
  iframe.setAttribute("scrolling", "no");
  iframe.style.scrollbarWidth = "none";
  iframe.style.msOverflowStyle = "none";

  // ---- URL BUILDER ----
  const makeSrc = (lang) => \`\${CONFIG.base}/\${sanitizeLang(lang)}${variant.path}\`;

  // ---- INSERT IFRAME ----
  iframe.src = makeSrc(CONFIG.initialLang);
  container.appendChild(iframe);

  // ---- HIDE SCROLLBARS ----
  iframe.onload = () => {
    try {
      // Check if 404 inside frame
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc.title && doc.title.toLowerCase().includes("404")) {
        iframe.src = makeSrc("en");
        return;
      }

      const style = doc.createElement("style");
      style.innerHTML = \`
        html, body { overflow: hidden !important; scrollbar-width: none !important; }
        ::-webkit-scrollbar { display: none !important; }
      \`;
      doc.head.appendChild(style);
    } catch (e) { /* cross-origin */ }
  };

  // ---- LANGUAGE OBSERVER ----
  const langObserver = new MutationObserver(() => {
    let lang = sanitizeLang(document.documentElement.lang);
    const currentSrcLang = iframe.src.split("/")[3];

    if (lang !== currentSrcLang) {
      iframe.src = makeSrc(lang);
    }
  });

  langObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });

  // ---- RESIZING ----
  let lastHeight = 0;
  window.addEventListener("message", (event) => {
    if (!CONFIG.allowedOrigins.includes(event.origin)) return;

    const data = event.data || {};
    if (data.type === "meetswiss-resize") {
      const raw = parseInt(data.height, 10);
      if (!raw || raw <= 0) return;

      let newHeight = Math.max(CONFIG.minHeight, Math.min(CONFIG.maxHeight, raw + CONFIG.buffer));
      if (Math.abs(newHeight - lastHeight) < CONFIG.threshold) return;

      lastHeight = newHeight;
      iframe.style.height = newHeight + "px";
    }
  });

  // ---- PUBLIC API ----
  container.bookingWidget = {
    iframe,
    setLang(lang) {
      lang = sanitizeLang(lang);
      iframe.src = makeSrc(lang);
    },
    destroy() {
      langObserver.disconnect();
      window.removeEventListener("message", () => {});
      try { container.removeChild(iframe); } catch (e) {}
      delete container.bookingWidget;
    }
  };

  window.__bookingWidget = container.bookingWidget;

})();
</script>`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
  };

  const selectedForm = formVariants.find((v) => v.id === selectedVariant) || formVariants[0];

  if (!mounted) return null;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-2">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">
            Stable
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Widget <span className="text-primary">Configurator</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            Choose a design and embed it on any website with a single line of code.
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <Button 
            size="lg"
            onClick={() => copyToClipboard(getEmbedScript(selectedForm), "top-copy")}
            className="w-full lg:w-auto shadow-lg shadow-primary/20 px-8 py-6 text-md font-bold"
          >
            {copiedId === "top-copy" ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
            Get Embed Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Selection & Features */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Form Variants</h3>
            <div className="grid gap-3">
              {formVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedVariant === variant.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-transparent bg-card hover:border-muted hover:bg-muted/50"
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-lg transition-colors ${
                    selectedVariant === variant.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {variant.icon}
                  </div>
                  <div className="pr-6">
                    <h4 className="font-bold text-sm">{variant.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {variant.description}
                    </p>
                  </div>
                  {selectedVariant === variant.id && (
                    <div className="absolute right-4 top-4">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          <Card className="bg-muted/30 border-none hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" /> Key Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedForm.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {feature}
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Button 
            variant="ghost" 
            className="w-full justify-between hover:bg-primary/10 hover:text-primary transition-colors py-6 border md:border-none"
            onClick={() => setShowCode(!showCode)}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="font-semibold">Developer Settings</span>
            </div>
            <Badge variant="default" className="font-mono">{showCode ? "Hide" : "Show"}</Badge>
          </Button>
        </div>

        {/* Main Content: Preview & Code */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          {/* Preview Window Frame */}
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm">
                PREVIEW: {selectedForm.id.toUpperCase()}
              </div>
              <div className="w-8 md:w-12" />
            </div>
            
            <div className="p-0 md:p-8 bg-slate-50 dark:bg-slate-950/50">
              <div className="w-full lg:max-w-md mx-auto bg-white dark:bg-black md:rounded-xl shadow-2xl overflow-hidden md:border">
                <iframe
                  key={selectedVariant}
                  src={`${selectedForm.path}`}
                  className="w-full h-[650px] md:h-[600px]"
                  title="Widget Preview"
                />
              </div>
            </div>
          </div>

          {showCode && (
            <Card className="border-none bg-slate-900 text-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">SNIPPET.JS</span>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-8 bg-white/10 hover:bg-white/20 border-none text-white font-bold"
                  onClick={() => copyToClipboard(getEmbedScript(selectedForm), "code-block")}
                >
                  {copiedId === "code-block" ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                  Copy
                </Button>
              </div>
              <CardContent className="p-0">
                <pre className="p-6 text-xs md:text-sm font-mono overflow-x-auto max-h-[500px] leading-relaxed text-blue-300/90 scrollbar-thin scrollbar-thumb-white/10">
                  <code>{getEmbedScript(selectedForm)}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}