export function createEmbedScript(baseUrl: string, path: string) {
  return `<div id="booking-widget-root"></div>
<script>
(function () {
  function sanitizeLang(lang) {
    let out = (lang || "en").split("-")[0].toLowerCase();
    if (!out || out === "auto" || out === "default") out = "en";
    return out;
  }
  const CONFIG = {
    containerId: "booking-widget-root",
    base: ${JSON.stringify(baseUrl)},
    allowedOrigins: [${JSON.stringify(baseUrl)}],
    buffer: 20,
    minHeight: 300,
    maxHeight: 2000,
    threshold: 10,
    animation: "height 260ms ease",
    initialLang: sanitizeLang(document.documentElement.lang)
  };
  const container = document.getElementById(CONFIG.containerId);
  if (!container) return;
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
  iframe.setAttribute("allow", "payment *");
  const makeSrc = (lang) => CONFIG.base + "/" + sanitizeLang(lang) + ${JSON.stringify(path)};
  iframe.src = makeSrc(CONFIG.initialLang);
  container.appendChild(iframe);
  window.addEventListener("message", (event) => {
    if (!CONFIG.allowedOrigins.includes(event.origin)) return;
    const data = event.data || {};
    if (data.type === "meetswiss-resize") {
      const raw = parseInt(data.height, 10);
      if (!raw || raw <= 0) return;
      const newHeight = Math.max(CONFIG.minHeight, Math.min(CONFIG.maxHeight, raw + CONFIG.buffer));
      iframe.style.height = newHeight + "px";
    }
  });
})();
</script>`;
}
