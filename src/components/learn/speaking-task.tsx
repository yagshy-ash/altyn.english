"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mic, Square } from "lucide-react";
import { submitSpeaking } from "@/app/actions/learning";
import { fmt, type AppLocale, type Dict } from "@/i18n";
import type { Feedback, SpeakingBody } from "@/lib/content-schemas";
import { FeedbackView } from "./feedback-view";
import { SpeakButton } from "./speak-button";
import { useSpeech } from "./use-speech";

export function SpeakingTask({ contentId, body, locale, t }: { contentId: string; body: SpeakingBody; locale: AppLocale; t: Dict }) {
  const speech = useSpeech();
  const [seconds, setSeconds] = useState(0);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!speech.listening) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [speech.listening]);

  const answer = speech.supported ? speech.text : typed;
  const over = seconds > body.targetSeconds;
  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const send = () =>
    start(async () => {
      speech.stop();
      setError("");
      try {
        setFeedback(await submitSpeaking(contentId, answer, Math.round((Date.now() - startedAt.current) / 1000)));
      } catch {
        setError(t.common.error);
      }
    });

  const reset = () => {
    speech.stop();
    speech.setFinalText("");
    setTyped("");
    setSeconds(0);
    setFeedback(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-3 border-b-4 border-teal bg-teal-soft">
        <p className="text-lg font-extrabold">{body.task[locale]}</p>
        <div className="flex items-center gap-3">
          <SpeakButton text={body.questionEn} label={t.speaking.listenQuestion} />
          <p className="font-read text-xl font-semibold">{body.questionEn}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {body.hints.map((h) => (
            <span key={h} className="chip bg-sheet px-3 py-1 text-sm text-teal-dark">{h}</span>
          ))}
        </div>
      </section>

      {!feedback && (
        <section className="card flex flex-col items-center gap-4 py-8 text-center">
          <p className={`text-6xl font-black tabular-nums ${over ? "text-red" : ""}`}>{mm}</p>
          <p className="font-extrabold text-muted">{fmt(t.speaking.target, { n: body.targetSeconds })}</p>

          {speech.supported ? (
            <>
              <button
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={speech.listening ? t.speaking.stop : t.speaking.start}
                className={`grid size-24 place-items-center rounded-full border-b-[6px] text-white transition-transform active:translate-y-1 active:border-b-2 ${speech.listening ? "animate-pulse border-red-dark bg-red" : "border-teal-dark bg-teal"}`}
              >
                {speech.listening ? <Square size={36} fill="currentColor" /> : <Mic size={40} strokeWidth={2.5} />}
              </button>
              <p className="font-black text-teal-dark">{speech.listening ? t.speaking.recording : t.speaking.start}</p>
              {answer && (
                <div className="w-full rounded-2xl bg-bg p-4 text-left">
                  <p className="eyebrow mb-1">{t.speaking.transcript}</p>
                  <p className="font-read text-lg">{answer}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="rounded-2xl bg-yellow-soft p-3 text-sm font-bold">{t.speaking.notSupported}</p>
              <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={5} className="input font-read font-normal" />
            </>
          )}

          <div className="flex gap-3">
            <button className="btn" onClick={reset} disabled={pending}>{t.speaking.again}</button>
            <button className="btn btn-green px-8" disabled={pending || answer.split(/\s+/).length < 3} onClick={send}>
              {pending ? t.writing.evaluating : t.speaking.send}
            </button>
          </div>
          {error && <p className="font-bold text-red-dark">{error}</p>}
        </section>
      )}

      {feedback && (
        <>
          <FeedbackView f={feedback} t={t} />
          <div className="flex justify-center gap-3">
            <SpeakButton text={feedback.natural} label={t.vocab.listen} />
            <button className="btn" onClick={reset}>{t.common.tryAgain}</button>
          </div>
        </>
      )}
    </div>
  );
}
