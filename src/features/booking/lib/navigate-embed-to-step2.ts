export function navigateEmbedToStep2(fullUrl: string): void {
  // Always try to break out of iframe by navigating the top window
  try {
    if (window.top && window.top !== window) {
      // We're in an iframe, try to navigate parent
      window.top.location.href = fullUrl;
    } else {
      // We're not in an iframe, navigate normally
      window.location.href = fullUrl;
    }
  } catch (error) {
    // Cross-origin restrictions prevent accessing window.top.location
    // Force navigation with a fallback approach
    console.debug(
      "Cross-origin restriction, using alternative navigation",
      error
    );

    // Try using window.open with _top target as fallback
    try {
      window.open(fullUrl, "_top");
    } catch {
      // Last resort: regular navigation
      window.location.href = fullUrl;
    }
  }
}
