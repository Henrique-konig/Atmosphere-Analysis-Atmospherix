/** "auto" follows the system setting. */
export type ThemePreference = "auto" | "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Browser bar colour for each resolved theme. */
const THEME_COLOR = { light: "#cfe0f2", dark: "#1b3a63" } as const;

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref !== "auto") return pref;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Sets `data-theme` on <html>, which the CSS keys its colours off. */
export function applyTheme(pref: ThemePreference) {
  const theme = resolveTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

/** Calls `onChange` when the system switches between light and dark. */
export function watchSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Inlined in <head> so the saved theme applies before the first paint (no flash of the
 * wrong theme). Mirrors resolveTheme; keep the storage key in sync with lib/storage.ts.
 */
export const THEME_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("atmospherix:theme"));var d=p==="dark"||(p!=="light"&&matchMedia("${DARK_QUERY}").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="dark"}`;
