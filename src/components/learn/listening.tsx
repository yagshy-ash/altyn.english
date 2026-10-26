"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Snail } from "lucide-react";
import type { AppLocale, Dict } from "@/i18n";
import type { ListeningBody } from "@/lib/content-schemas";
import { englishVoice, speak, stopSpeaking } from "./tts";
import { Quiz } from "./quiz";

// Diyalogda "Anna: …" satırlarına konuşmacıya göre farklı ses atanır
export function Listening({ contentId, body, locale, t }: { contentId: string; body: ListeningBody; locale: AppLocale; t: Dict }) {
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(-1);
  const [slow, setSlow] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [done, setDone] = useState(false);
  const stopped = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  const play = () => {
    stopSpeaking();
    stopped.current = false;
    setPlaying(true);
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
    const speakers = new Map<string, SpeechSynthesisVoice | undefined>();
    const next = (i: number) => {
      if (stopped.current || i >= body.script.length) {
        setPlaying(false);
        setLine(-1);
        return;
      }
      setLine(i);
      const m = body.script[i].match(/^([A-Z][\w .'-]{0,20}):\s*(.*)$/);
      const name = m?.[1];
      if (name && !speakers.has(name)) speakers.set(name, voices[speakers.size % Math.max(1, voices.length)] ?? englishVoice());
      speak(m ? m[2] : body.script[i], { rate: slow ? 0.75 : 0.95, voice: name ? speakers.get(name) : undefined, onEnd: () => next(i + 1) });
    };
    next(0);
  };

  const pause = () => {
    stopped.current = true;
    stopSpeaking();
    setPlaying(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-4 border-b-4 border-orange bg-orange-soft py-8 text-center">
        <p className="font-bold text-orange-dark">{t.quiz.listenFirst}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={playing ? pause : play}
            className="grid size-20 place-items-center rounded-full border-b-[6px] border-orange-dark bg-orange text-white transition-transform active:translate-y-1 active:border-b-2"
            aria-label={playing ? t.quiz.pause : t.quiz.play}
          >
            {playing ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={() => setSlow((s) => !s)} aria-pressed={slow} className="btn btn-sm aria-pressed:border-orange aria-pressed:text-orange-dark">
            <Snail size={16} /> {t.quiz.slow}
          </button>
        </div>
        {playing && (
          <div className="flex h-6 items-end gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-1.5 animate-pulse rounded-full bg-orange" style={{ height: `${10 + ((i * 7) % 14)}px`, animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        )}
        {(done || showScript) && (
          <button onClick={() => setShowScript((s) => !s)} className="text-sm font-extrabold text-orange-dark underline">
            {t.quiz.showScript}
          </button>
        )}
      </section>

      {showScript && (
        <section className="card flex flex-col gap-2 font-read text-lg leading-relaxed">
          {body.script.map((s, i) => (
            <p key={i} className={i === line ? "rounded-lg bg-orange-soft" : ""}>{s}</p>
          ))}
        </section>
      )}

      <details className="card">
        <summary className="cursor-pointer font-black">{t.quiz.glossary}</summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {body.glossary.map((g) => (
            <div key={g.word} className="rounded-xl bg-bg p-2">
              <dt className="font-extrabold">{g.word}</dt>
              <dd className="text-sm font-semibold text-muted">{g[locale]}</dd>
            </div>
          ))}
        </dl>
      </details>

      <h2 className="h2">{t.quiz.questions}</h2>
      <Quiz contentId={contentId} items={body.questions} locale={locale} t={t} backHref="/student/listening" onFinished={() => { setDone(true); setShowScript(true); }} />
    </div>
  );
}
