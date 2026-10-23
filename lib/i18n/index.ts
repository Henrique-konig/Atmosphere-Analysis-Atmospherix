import { en } from "./en";
import { es } from "./es";
import { pt, type MessageKey, type Messages } from "./pt";

export type { MessageKey } from "./pt";

export type Locale = "pt" | "en" | "es";

export const LOCALES: { code: Locale; tag: string; name: string }[] = [
  { code: "pt", tag: "pt-BR", name: "Português" },
  { code: "en", tag: "en-US", name: "English" },
  { code: "es", tag: "es-ES", name: "Español" },
];

const MESSAGES: Record<Locale, Messages> = { pt, en, es };

/**
 * The language of the interface. It is a module value rather than a parameter so plain
 * helpers (conditions, risks, formatting) can translate without threading it everywhere;
 * the provider sets it before re-rendering the screen.
 */
let current: Locale = "pt";

export const getLocale = () => current;

export function setLocale(locale: Locale) {
  current = locale;
}

export const isLocale = (value: unknown): value is Locale => LOCALES.some((l) => l.code === value);

/** BCP 47 tag for Intl formatters and the `lang` attribute: "pt-BR", "en-US"… */
export const localeTag = (locale: Locale = current) => LOCALES.find((l) => l.code === locale)!.tag;

/** Best match for the browser's preferred languages, falling back to Portuguese. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    const code = lang.slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return "pt";
}

/** The text for `key` in the current language, with `{name}` placeholders filled in. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const text = MESSAGES[current][key] ?? pt[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
