"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitWriting } from "@/app/actions/learning";
import { fmt, type AppLocale, type Dict } from "@/i18n";
import type { Feedback, WritingBody } from "@/lib/content-schemas";
import { FeedbackView } from "./feedback-view";

export function WritingTask({ contentId, body, locale, t }: { contentId: string; body: WritingBody; locale: AppLocale; t: Dict }) {
  const key = `draft.${contentId}`;
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Taslak bu tarayıcıda saklanır; mount'ta localStorage'dan bir kez okunur
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- harici depodan tek seferlik okuma
      setText(localStorage.getItem(key) ?? "");
    } catch {}
  }, [key]);

  const send = () =>
    start(async () => {
      setError("");
      try {
        const f = await submitWriting(contentId, text, Math.round((Date.now() - started.current) / 1000));
        setFeedback(f);
        try {
          localStorage.removeItem(key);
        } catch {}
      } catch {
        setError(t.common.error);
      }
    });

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-3 border-b-4 border-pink bg-pink-soft">
        <p className="text-lg font-extrabold">{body.task[locale]}</p>
        <p className="font-read text-muted italic">{body.taskEn}</p>
        {body.hints.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="eyebrow">{t.writing.hints}</span>
            <div className="flex flex-wrap gap-2">
              {body.hints.map((h) => (
                <span key={h} className="chip bg-sheet px-3 py-1 text-sm text-pink-dark">{h}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {!feedback && (
        <section className="card flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              try {
                localStorage.setItem(key, e.target.value);
              } catch {}
            }}
            placeholder={t.writing.placeholder}
            rows={10}
            spellCheck={false}
            className="input font-read text-lg leading-relaxed font-normal"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`font-extrabold ${words >= body.minWords ? "text-green-dark" : "text-muted"}`}>
              {fmt(t.writing.wordCount, { n: words })} · {fmt(t.writing.minWords, { n: body.minWords })}
            </span>
            <button className="btn btn-green px-8 py-3" disabled={pending || words < 3} onClick={send}>
              {pending ? t.writing.evaluating : t.writing.send}
            </button>
          </div>
          {error && <p className="font-bold text-red-dark">{error}</p>}
        </section>
      )}

      {feedback && (
        <>
          <FeedbackView f={feedback} t={t} />
          <button className="btn self-center" onClick={() => { setFeedback(null); setText(""); started.current = Date.now(); }}>
            {t.common.tryAgain}
          </button>
        </>
      )}
    </div>
  );
}
