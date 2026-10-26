"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { addSetToDeck } from "@/app/actions/learning";
import type { AppLocale, Dict } from "@/i18n";
import type { VocabularyBody } from "@/lib/content-schemas";
import { SpeakButton } from "./speak-button";

export function VocabSet({ contentId, body, locale, t, added: initiallyAdded }: { contentId: string; body: VocabularyBody; locale: AppLocale; t: Dict; added: boolean }) {
  const [added, setAdded] = useState(initiallyAdded);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 md:grid-cols-2">
        {body.words.map((w) => (
          <li key={w.word} className="card flex gap-3 p-4">
            <SpeakButton text={w.word.replace(/ – /g, ", ")} label={t.vocab.listen} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-black">{w.word}</span>
                <span className="text-xs font-extrabold text-muted italic">{w.pos}</span>
              </p>
              <p className="font-extrabold text-purple-dark">{w[locale]}</p>
              <p className="mt-1 font-read text-sm text-muted">{w.example}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 -mx-4 flex justify-center gap-3 border-t-2 border-line bg-bg/95 px-4 py-4 backdrop-blur">
        {added ? (
          <>
            <span className="btn border-green text-green-dark">
              <Check size={18} strokeWidth={3} /> {t.vocab.added}
            </span>
            <Link href="/student/review" className="btn btn-green">{t.student.reviewNow}</Link>
          </>
        ) : (
          <button
            className="btn btn-green px-8 py-3"
            disabled={pending}
            onClick={() => start(async () => { await addSetToDeck(contentId); setAdded(true); })}
          >
            <Plus size={18} strokeWidth={3} /> {t.vocab.addToDeck}
          </button>
        )}
      </div>
    </div>
  );
}
