"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mic, Send, Square } from "lucide-react";
import { endChat, sendChat, startChat } from "@/app/actions/learning";
import type { AppLocale, Dict } from "@/i18n";
import type { Feedback } from "@/lib/content-schemas";
import type { Scenario } from "@/lib/scenarios";
import { FeedbackView } from "./feedback-view";
import { SpeakButton } from "./speak-button";
import { speak } from "./tts";
import { useSpeech } from "./use-speech";

type Msg = { role: "student" | "partner"; text: string; fix?: { hasError: boolean; corrected: string; why: string } };

export function ChatRoom({ scenarios, locale, t }: { scenarios: Scenario[]; locale: AppLocale; t: Dict }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const bottom = useRef<HTMLDivElement>(null);
  const speech = useSpeech();

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pending]);
  // Mikrofon açıkken kutuda konuşma metni görünür
  const shown = speech.listening ? speech.text : input;
  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
      setInput(speech.text);
    } else {
      speech.setFinalText("");
      speech.start();
    }
  };

  const history = (list: Msg[]) => list.map(({ role, text }) => ({ role, text }));

  const begin = (s: Scenario) =>
    start(async () => {
      setScenario(s);
      setMsgs([]);
      setFeedback(null);
      setError("");
      startedAt.current = Date.now();
      try {
        const opening = await startChat(s.id);
        setMsgs([{ role: "partner", text: opening }]);
        speak(opening);
      } catch {
        setError(t.common.error);
      }
    });

  const send = () => {
    const text = shown.trim();
    if (!text || !scenario) return;
    speech.stop();
    speech.setFinalText("");
    setInput("");
    const next: Msg[] = [...msgs, { role: "student", text }];
    setMsgs(next);
    start(async () => {
      try {
        const turn = await sendChat(scenario.id, history(next));
        setMsgs((m) => {
          const copy = [...m];
          copy[next.length - 1] = { ...copy[next.length - 1], fix: turn.fix };
          return [...copy, { role: "partner", text: turn.reply }];
        });
        speak(turn.reply);
      } catch {
        setError(t.common.error);
      }
    });
  };

  const finish = () =>
    start(async () => {
      if (!scenario) return;
      if (msgs.filter((m) => m.role === "student").length < 3) return setError(t.chat.minTurns);
      try {
        setFeedback(await endChat(scenario.id, history(msgs), Math.round((Date.now() - startedAt.current) / 1000)));
      } catch {
        setError(t.common.error);
      }
    });

  if (!scenario) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-bold text-muted">{t.chat.desc}</p>
        <h2 className="h2">{t.chat.pick}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <li key={s.id}>
              <button onClick={() => begin(s)} disabled={pending} className="card flex h-full w-full flex-col items-start gap-2 border-b-4 text-left transition-transform hover:-translate-y-0.5">
                <span className="text-4xl">{s.emoji}</span>
                <span className="text-lg font-black">{s.title[locale]}</span>
                <span className="text-sm font-semibold text-muted">{s.goal[locale]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap items-center gap-3 border-b-4 border-blue bg-blue-soft">
        <span className="text-4xl">{scenario.emoji}</span>
        <div className="flex-1">
          <p className="text-lg font-black">{scenario.title[locale]}</p>
          <p className="text-sm font-bold text-blue-dark">
            {t.chat.goal}: {scenario.goal[locale]}
          </p>
        </div>
        <button className="btn btn-sm" onClick={() => setScenario(null)}>{t.chat.newChat}</button>
      </div>

      {!feedback && (
        <div className="card flex flex-col gap-3">
          <div className="flex max-h-[55vh] min-h-64 flex-col gap-3 overflow-y-auto pr-1">
            {msgs.map((m, i) => (
              <div key={i} className={`flex max-w-[85%] flex-col gap-1 ${m.role === "student" ? "items-end self-end" : "items-start self-start"}`}>
                <div className="flex items-end gap-2">
                  {m.role === "partner" && <SpeakButton text={m.text} label={t.vocab.listen} />}
                  <p
                    className={`rounded-3xl px-4 py-2.5 font-semibold whitespace-pre-wrap ${m.role === "student" ? "rounded-br-md bg-blue text-white" : "rounded-bl-md border-2 border-line bg-sheet"}`}
                  >
                    {m.text}
                  </p>
                </div>
                {m.fix &&
                  (m.fix.hasError ? (
                    <div className="rounded-2xl bg-red-soft px-3 py-2 text-sm">
                      <p className="font-extrabold text-green-dark">✓ {m.fix.corrected}</p>
                      <p className="font-semibold text-muted">{m.fix.why}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-extrabold text-green-dark">{t.chat.fixOk}</p>
                  ))}
              </div>
            ))}
            {pending && <p className="animate-pulse text-sm font-bold text-muted">{t.chat.typing}</p>}
            <div ref={bottom} />
          </div>

          <div className="flex items-end gap-2 border-t-2 border-line pt-3">
            {speech.supported && (
              <button
                onClick={toggleMic}
                aria-label={t.chat.speak}
                title={t.chat.speak}
                className={`grid size-12 shrink-0 place-items-center rounded-2xl border-b-4 text-white ${speech.listening ? "animate-pulse border-red-dark bg-red" : "border-teal-dark bg-teal"}`}
              >
                {speech.listening ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
              </button>
            )}
            <textarea
              value={shown}
              onChange={(e) => setInput(e.target.value)}
              readOnly={speech.listening}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t.chat.placeholder}
              className="input min-h-12 resize-none"
            />
            <button onClick={send} disabled={pending || !shown.trim()} aria-label={t.chat.send} className="btn btn-blue size-12 shrink-0 p-0">
              <Send size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            {error ? <p className="text-sm font-bold text-red-dark">{error}</p> : <span />}
            <button className="btn btn-orange btn-sm" disabled={pending} onClick={finish}>{t.chat.end}</button>
          </div>
        </div>
      )}

      {feedback && (
        <>
          <FeedbackView f={feedback} t={t} />
          <button className="btn btn-green self-center" onClick={() => setScenario(null)}>{t.chat.newChat}</button>
        </>
      )}
    </div>
  );
}
