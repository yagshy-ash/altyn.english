"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { finishReview, reviewCard } from "@/app/actions/learning";
import { fmt, type Dict } from "@/i18n";
import { ProgressBar } from "@/components/skill-icon";
import { SpeakButton } from "./speak-button";

export type ReviewCard = { id: string; word: string; translation: string; example: string | null; source: string };

// Bilinmeyen kart oturumun sonuna tekrar eklenir; kart başına sunucu Leitner kutusunu günceller
export function ReviewSession({ cards, t }: { cards: ReviewCard[]; t: Dict }) {
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; known: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [, start] = useTransition();

  const card = queue[0];
  const doneCount = cards.length - new Set(queue.map((c) => c.id)).size;

  // Her kartın ilk cevabı puana sayılır; tekrar gösterilen kartlar sayılmaz
  const firstPass = (list: { cardId: string; known: boolean }[]) => {
    const m = new Map<string, boolean>();
    for (const r of list) if (!m.has(r.cardId)) m.set(r.cardId, r.known);
    return m;
  };

  const grade = (known: boolean) => {
    start(() => reviewCard(card.id, known));
    const nextResults = [...results, { cardId: card.id, known }];
    setResults(nextResults);
    const rest = queue.slice(1);
    const nextQueue = known ? rest : [...rest, card];
    setFlipped(false);
    if (!nextQueue.length) {
      setFinished(true);
      const first = [...firstPass(nextResults)].map(([cardId, k]) => ({ cardId, known: k }));
      start(() => finishReview(first, Math.round((Date.now() - started.current) / 1000)));
    }
    setQueue(nextQueue);
  };

  if (finished || !card) {
    const first = firstPass(results);
    const known = [...first.values()].filter(Boolean).length;
    return (
      <div className="animate-pop card mx-auto flex max-w-md flex-col items-center gap-3 border-b-4 border-purple py-10 text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="h1">{t.vocab.sessionDone}</h2>
        <p className="font-black text-purple-dark">{fmt(t.vocab.knownCount, { n: known, total: first.size })}</p>
        <Link href="/student" className="btn btn-green mt-3">{t.common.continue}</Link>
      </div>
    );
  }

  const isMistake = card.source === "mistake";
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <ProgressBar value={(doneCount / cards.length) * 100} className="bg-purple" />
      <div className="card flex min-h-72 flex-col items-center justify-center gap-4 border-b-4 p-8 text-center">
        {isMistake && <span className="chip bg-red-soft text-red-dark">{t.insights.mistakeCard}</span>}
        {isMistake && card.example && <p className="font-read text-lg text-red line-through decoration-2">{card.example}</p>}
        <div className="flex items-center gap-3">
          <p className="text-3xl font-black">{card.word}</p>
          <SpeakButton text={card.word.replace(/ – /g, ", ")} label={t.vocab.listen} />
        </div>
        {flipped ? (
          <div className="animate-pop flex flex-col gap-2">
            <p className="text-xl font-black text-purple-dark">{card.translation}</p>
            {!isMistake && card.example && <p className="font-read text-muted">{card.example}</p>}
          </div>
        ) : (
          <button className="btn mt-2" onClick={() => setFlipped(true)}>{t.vocab.showAnswer}</button>
        )}
      </div>
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-red py-4 text-base" onClick={() => grade(false)}>{t.vocab.didntKnow}</button>
          <button className="btn btn-green py-4 text-base" onClick={() => grade(true)}>{t.vocab.knew}</button>
        </div>
      )}
    </div>
  );
}
