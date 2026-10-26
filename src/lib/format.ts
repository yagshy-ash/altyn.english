import type { AppLocale } from "@/i18n";

// Bütün tarih/saat gösterimleri ve "gün" hesapları bu saat diliminde yapılır.
export const TIME_ZONE = process.env.APP_TIMEZONE ?? "Asia/Ashgabat";

export function formatDate(d: Date | null | undefined, locale: AppLocale, withTime = false) {
  if (!d) return null;
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    ...(withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }),
  }).format(d);
}

export function formatTime(d: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatWeekday(d: Date, locale: AppLocale, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, weekday: style, day: "numeric", month: "short" }).format(d);
}

// "2026-10-22" (saat dilimine göre)
export function dayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

// @db.Date alanları için: o günün UTC gece yarısı
export function dayDate(key = dayKey()) {
  return new Date(`${key}T00:00:00Z`);
}

export function startOfDay(d = new Date()) {
  return dayDate(dayKey(d));
}

export function daysAgo(n: number) {
  const d = startOfDay();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function minutes(seconds: number) {
  return Math.round(seconds / 60);
}

const UNITS: Record<AppLocale, { h: string; m: string }> = {
  tr: { h: "sa", m: "dk" },
  tk: { h: "sag", m: "min" },
  ru: { h: "ч", m: "мин" },
};

export function formatDuration(seconds: number, locale: AppLocale) {
  const u = UNITS[locale];
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} ${u.m}`;
  return `${Math.floor(m / 60)} ${u.h} ${m % 60} ${u.m}`;
}

// TIME_ZONE'da verilen günün (varsayılan bugün) başladığı gerçek an
export function zoneDayStart(key = dayKey()) {
  const utcMidnight = new Date(`${key}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(utcMidnight);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(utcMidnight.getTime() - (asIfUtc - utcMidnight.getTime()));
}
