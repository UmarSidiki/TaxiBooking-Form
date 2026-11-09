"use client";

import { useEffect } from "react";

const IFRAME_RESIZE_MESSAGE_TYPE = "meetswiss-resize";

export function useIframeBodyResize() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;

    let raf = 0;
    let queued = false;

    const postHeight = () => {
      if (queued) return;
      queued = true;
      raf = window.requestAnimationFrame(() => {
        queued = false;
        const height = document.body.scrollHeight;
        window.parent.postMessage(
          { type: IFRAME_RESIZE_MESSAGE_TYPE, height },
          "*"
        );
      });
    };

    // Observe size changes of the body only
    const resizeObserver = new ResizeObserver(() => {
      postHeight();
    });
    resizeObserver.observe(document.body);

    // Observe DOM mutations
    const mutationObserver = new MutationObserver(() => {
      postHeight();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // First render
    postHeight();

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}
