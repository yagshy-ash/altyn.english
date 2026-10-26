"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions/auth";
import { LOCALES, type AppLocale } from "@/i18n";

const LABELS: Record<AppLocale, string> = { tr: "🇹🇷 TR", tk: "🇹🇲 TK", ru: "🇷🇺 RU" };

export function LanguageSwitcher({ current, label }: { current: AppLocale; label: string }) {
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={label} className="flex rounded-2xl border-2 border-line bg-sheet p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === current}
          onClick={() => start(() => setLocale(l))}
          className="flex-1 rounded-xl px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-muted aria-pressed:bg-blue aria-pressed:text-white"
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
