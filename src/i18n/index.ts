import { tr, type Dict } from "./tr";
import { tk } from "./tk";
import { ru } from "./ru";

export const LOCALES = ["tr", "tk", "ru"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "locale";

const dicts: Record<AppLocale, Dict> = { tr, tk, ru };

export function isLocale(v: unknown): v is AppLocale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function getDict(locale: AppLocale): Dict {
  return dicts[locale];
}

// "Merhaba, {name}" → "Merhaba, Ayna"
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export type { Dict };
