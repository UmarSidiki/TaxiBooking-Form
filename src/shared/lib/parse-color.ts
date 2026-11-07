const HEX_PATTERN = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/;
const RGB_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)$/;

/**
 * Converts an admin-configured colour (hex or rgb/rgba) to an rgba string with
 * an extra opacity applied. Form-builder styles allow both formats, so callers
 * must not assume 6-digit hex.
 */
export function toRgba(color: string, opacityPercent = 100): string {
  const opacity = Math.min(1, Math.max(0, opacityPercent / 100));
  const value = color.trim();

  if (value.startsWith("#") && HEX_PATTERN.test(value.slice(1))) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const rgb = value.match(RGB_PATTERN);
  if (rgb) {
    const r = Math.min(255, Number(rgb[1]));
    const g = Math.min(255, Number(rgb[2]));
    const b = Math.min(255, Number(rgb[3]));
    const alpha = rgb[4] === undefined ? 1 : Math.min(1, Math.max(0, Number(rgb[4])));
    return `rgba(${r}, ${g}, ${b}, ${opacity * alpha})`;
  }

  return `rgba(255, 255, 255, ${opacity})`;
}
