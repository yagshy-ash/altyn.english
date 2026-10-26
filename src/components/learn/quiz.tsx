"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { submitQuiz } from "@/app/actions/learning";
import { fmt, type AppLocale, type Dict } from "@/i18n";
import type { Question } from "@/lib/content-schemas";
import { ProgressBar } from "@/components/skill-icon";

// Okuma, dinleme ve gramer soruları. Puanlama sunucuda yapılır (cevap anahtarı güvenilir kaynaktan).
export function Quiz({
  contentId,
  items,
  locale,
  t,
  backHref,
  onFinished,
}: {
  contentId: string;
  items: Question[];
  locale: AppLocale;
  t: Dict;
  backHref: string;
  onFinished?: () => void;
}) {
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null));
  const [result, setResult] = useState<{ score: number; correct: boolean[] } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const answered = answers.filter((a) => a !== null).length;

  const submit = () => {
    if (answered < items.length) return setError(t.quiz.answerAll);
    setError("");
    start(async () => {
      try {
        const r = await submitQuiz(contentId, answers as number[], Math.round((Date.now() - started.current) / 1000));
        setResult(r);
        onFinished?.();
      } catch {
        setError(t.common.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {!result && <ProgressBar value={(answered / items.length) * 100} />}
      {result && (
        <div className={`animate-pop card flex flex-col items-center gap-2 border-b-4 text-center ${result.score >= 80 ? "border-green bg-green-soft" : result.score >= 50 ? "border-yellow bg-yellow-soft" : "border-red bg-red-soft"}`}>
          <span className="text-5xl">{result.score >= 80 ? "🏆" : result.score >= 50 ? "💪" : "🌱"}</span>
          <p className="text-4xl font-black tabular-nums">{result.score}%</p>
          <p className="font-black">
            {fmt(t.quiz.correctCount, { n: result.correct.filter(Boolean).length, total: items.length })} ·{" "}
            {result.score >= 80 ? t.quiz.great : result.score >= 50 ? t.quiz.good : t.quiz.keepGoing}
          </p>
          <Link href={backHref} className="btn btn-green mt-2">{t.common.continue}</Link>
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {items.map((q, i) => (
          <li key={i} className="card flex flex-col gap-3">
            <p className="text-lg font-extrabold">
              <span className="mr-2 text-muted">{i + 1}.</span>
              {q.question}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, j) => {
                const chosen = answers[i] === j;
                const isRight = result && j === q.answer;
                const isWrong = result && chosen && j !== q.answer;
                return (
                  <button
                    key={j}
                    type="button"
                    disabled={!!result}
                    onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                    className={`flex items-center gap-2 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-bold transition-colors ${
                      isRight
                        ? "border-green bg-green-soft text-green-dark"
                        : isWrong
                          ? "border-red bg-red-soft text-red-dark"
                          : chosen
                            ? "border-blue bg-blue-soft text-blue-dark"
                            : "border-line bg-sheet hover:bg-bg"
                    }`}
                  >
                    {isRight && <Check size={18} strokeWidth={3} />}
                    {isWrong && <X size={18} strokeWidth={3} />}
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            {result && (
              <p className={`rounded-2xl p-3 text-sm font-semibold ${result.correct[i] ? "bg-green-soft" : "bg-red-soft"}`}>
                <b>{result.correct[i] ? t.common.correct : t.common.wrong}</b> {q.explanation[locale]}
              </p>
            )}
          </li>
        ))}
      </ol>

      {!result && (
        <div className="sticky bottom-0 -mx-4 flex flex-col items-stretch gap-2 border-t-2 border-line bg-bg/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <span className="font-extrabold text-muted">
            {answered}/{items.length}
          </span>
          {error && <span className="font-bold text-red-dark">{error}</span>}
          <button className="btn btn-green px-10 py-3" disabled={pending} onClick={submit}>
            {pending ? t.common.loading : t.quiz.check}
          </button>
        </div>
      )}
    </div>
  );
}
