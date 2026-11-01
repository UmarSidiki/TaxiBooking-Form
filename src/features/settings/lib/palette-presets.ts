import { completeTokens, type PaletteSet } from "./palette-tokens";

/**
 * Source of truth for preset palettes. scripts/gen-riviera-palettes.ts writes
 * src/shared/style/riviera-palettes.css from this file.
 * Surface ladder (light): paper (page, tinted) < sheet (cards, softly dimmed white) < field (inputs, white).
 * Dark: paper (page) < field (inputs, recessed) < sheet (cards, raised) < well.
 */
export const PALETTE_PRESETS: Record<string, PaletteSet> = {
  neutral: completeTokens(
    { paper: "#F2F2F3", sheet: "#FAFAFA", field: "#FFFFFF", well: "#EBEBEC", ink: "#171717", ink2: "#555555", rule: "#DEDEE0", rule2: "#848484", sig: "#171717", "sig-on": "#FFFFFF", "sig-tint": "#EDEDED", link: "#1D4ED8", info: "#1D4ED8", ok: "#15803D", warn: "#A14A06", err: "#B91C1C", "ok-tint": "#EEF8F1", "warn-tint": "#FDF4EA", "err-tint": "#FDF0F0", "info-tint": "#EFF4FD", sidebar: "#FAFAFA" },
    { paper: "#0F0F0F", sheet: "#1A1A1A", field: "#141414", well: "#242424", ink: "#EDEDED", ink2: "#A8A8A8", rule: "#2E2E2E", rule2: "#707070", sig: "#EDEDED", "sig-on": "#111111", "sig-tint": "#262626", link: "#7DB4FB", info: "#7DB4FB", ok: "#5FD68E", warn: "#F5B94A", err: "#F88A8A", "ok-tint": "#14261B", "warn-tint": "#2A2112", "err-tint": "#2C1717", "info-tint": "#15203A", sidebar: "#1A1A1A" },
    "#F4F4F4",
  ),
  slate: completeTokens(
    { paper: "#EFF1F5", sheet: "#F9FAFC", field: "#FFFFFF", well: "#E7EAF0", ink: "#161A23", ink2: "#4E5668", rule: "#D8DDE6", rule2: "#7F879A", sig: "#4652D6", "sig-on": "#FFFFFF", "sig-tint": "#EEF0FD", link: "#3B47C9", info: "#3B47C9", ok: "#1A7F4B", warn: "#975600", err: "#C2333B", "ok-tint": "#ECF7F1", "warn-tint": "#FBF3E6", "err-tint": "#FCEFF0", "info-tint": "#EEF0FD", sidebar: "#F9FAFC" },
    { paper: "#0E1016", sheet: "#171A22", field: "#12141B", well: "#20242E", ink: "#ECEEF3", ink2: "#A3ABBC", rule: "#2A2F3B", rule2: "#687088", sig: "#8B93F5", "sig-on": "#0E1016", "sig-tint": "#232849", link: "#9EA5F7", info: "#9EA5F7", ok: "#4CC98A", warn: "#E6A846", err: "#F07178", "ok-tint": "#13261D", "warn-tint": "#2A2214", "err-tint": "#2C171B", "info-tint": "#1E2242", sidebar: "#171A22" },
    "#F3F4F7",
  ),
  heritage: completeTokens(
    { paper: "#F2EDE5", sheet: "#FBF9F5", field: "#FFFFFF", well: "#EBE4D9", ink: "#1E1916", ink2: "#5C534B", rule: "#E0D7CA", rule2: "#8F8478", sig: "#8E1B2B", "sig-on": "#FFFFFF", "sig-tint": "#F8ECEC", link: "#74551F", info: "#2F5C8A", ok: "#2D7547", warn: "#8A520A", err: "#B3261E", "ok-tint": "#EEF6F0", "warn-tint": "#FAF2E4", "err-tint": "#FBEEED", "info-tint": "#EDF2F8", sidebar: "#FBF9F5" },
    { paper: "#14110F", sheet: "#1E1A17", field: "#181513", well: "#28231F", ink: "#F3EEE7", ink2: "#B3A89E", rule: "#352E29", rule2: "#7A6E64", sig: "#E0737F", "sig-on": "#14110F", "sig-tint": "#3A2024", link: "#D2B07A", info: "#8FB6E0", ok: "#6CC28E", warn: "#E5AE5C", err: "#F2837A", "ok-tint": "#172519", "warn-tint": "#2B2214", "err-tint": "#2F1A18", "info-tint": "#18222E", sidebar: "#1E1A17" },
    "#F6F1EA",
  ),
  navy: completeTokens(
    { paper: "#EEF3F8", sheet: "#F9FBFD", field: "#FFFFFF", well: "#E5ECF3", ink: "#0A2540", ink2: "#45576E", rule: "#D4DDE8", rule2: "#76869D", sig: "#533AFD", "sig-on": "#FFFFFF", "sig-tint": "#EFECFF", link: "#0060C0", info: "#0060C0", ok: "#0D7752", warn: "#935400", err: "#BE2F57", "ok-tint": "#EAF6F1", "warn-tint": "#FBF3E5", "err-tint": "#FCEEF2", "info-tint": "#EAF3FC", sidebar: "#F9FBFD" },
    { paper: "#071A2F", sheet: "#0E2540", field: "#0A1F37", well: "#15304F", ink: "#EAF1F8", ink2: "#A4B6CC", rule: "#1F3A5A", rule2: "#5C7898", sig: "#9A8CFF", "sig-on": "#071A2F", "sig-tint": "#24305E", link: "#6CB8FF", info: "#6CB8FF", ok: "#3FD39A", warn: "#F2B553", err: "#FF8AA6", "ok-tint": "#0D3036", "warn-tint": "#2A2E2C", "err-tint": "#2E2440", "info-tint": "#133556", sidebar: "#0E2540" },
    "#EEF3F8",
  ),
};
