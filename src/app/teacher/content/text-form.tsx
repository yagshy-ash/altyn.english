"use client";

import { useActionState, useState } from "react";
import { Check, FileText, Plus, X } from "lucide-react";
import { createFromText } from "@/app/actions/teacher";
import { fmt, type Dict } from "@/i18n";
import { MAX_TEXT_CHARS } from "@/lib/content-schemas";
import { Level } from "@/generated/prisma/enums";

type Draft = { question: string; options: string[]; answer: number };
const LETTERS = "ABCD";
const emptyQuestion = (): Draft => ({ question: "", options: ["", "", ""], answer: 0 });

// Öğretmenin soruları: boş şıklar atılır, doğru cevap indeksi buna göre kaydırılır
function cleaned(questions: Draft[]) {
  return questions
    .filter((q) => q.question.trim())
    .map((q) => {
      const kept = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
      return { question: q.question.trim(), options: kept.map((x) => x.o), answer: kept.findIndex((x) => x.i === q.answer) };
    });
}

export function TextForm({ t, defaultLevel }: { t: Dict; defaultLevel?: Level }) {
  const [state, action, pending] = useActionState(createFromText, undefined);
  const [words, setWords] = useState(0);
  const [questions, setQuestions] = useState<Draft[]>([]);
  const [aiCount, setAiCount] = useState(5);
  const ready = cleaned(questions);
  const invalid = ready.some((q) => q.options.length < 2 || q.answer < 0);
  const errors: Record<string, string> = {
    tooShort: t.ownText.tooShort,
    tooLong: fmt(t.ownText.tooLong, { n: MAX_TEXT_CHARS }),
    badQuestion: t.ownText.badQuestion,
    noQuestions: t.ownText.noQuestions,
    ai: t.common.aiOff,
  };
  const update = (i: number, change: Partial<Draft>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...change } : q)));

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <p className="text-sm font-semibold text-muted">{t.ownText.desc}</p>
      <div>
        <label htmlFor="own-title" className="label">{t.ownText.title}</label>
        <input id="own-title" name="title" maxLength={200} className="input" placeholder={t.ownText.titlePlaceholder} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="own-skill" className="label">{t.ownText.type}</label>
          <select id="own-skill" name="skill" className="input px-2" defaultValue="READING">
            <option value="READING">{t.skills.READING.name}</option>
            <option value="LISTENING">{t.skills.LISTENING.name}</option>
          </select>
        </div>
        <div>
          <label htmlFor="own-level" className="label">{t.common.level}</label>
          <select id="own-level" name="level" className="input px-2" defaultValue={defaultLevel ?? "A1"}>
            {Object.values(Level).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="own-text" className="label">{t.ownText.text}</label>
        <textarea
          id="own-text"
          name="text"
          required
          rows={8}
          maxLength={MAX_TEXT_CHARS}
          className="input font-read font-normal"
          placeholder={t.ownText.textPlaceholder}
          onChange={(e) => setWords(e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0)}
        />
        <p className="mt-1 text-xs font-bold text-muted">{fmt(t.writing.wordCount, { n: words })}</p>
      </div>

      {/* Öğretmenin kendi soruları */}
      <div className="flex flex-col gap-3">
        <span className="label mb-0">{t.ownText.myQuestions}</span>
        {questions.map((q, i) => (
          <fieldset key={i} className="flex flex-col gap-2 rounded-2xl border-2 border-line p-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-muted">{i + 1}.</span>
              <input
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
                maxLength={500}
                className="input flex-1"
                placeholder={t.ownText.questionPlaceholder}
                aria-label={`${t.ownText.myQuestions} ${i + 1}`}
              />
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} className="btn btn-sm" aria-label={t.common.delete}>
                <X size={16} />
              </button>
            </div>
            {q.options.map((o, j) => (
              <div key={j} className="flex items-center gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => update(i, { answer: j })}
                  aria-pressed={q.answer === j}
                  title={t.ownText.markCorrect}
                  className={`grid size-8 shrink-0 place-items-center rounded-lg border-2 font-black ${q.answer === j ? "border-green-dark bg-green text-white" : "border-line"}`}
                >
                  {q.answer === j ? <Check size={16} /> : LETTERS[j]}
                </button>
                <input
                  value={o}
                  onChange={(e) => update(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })}
                  maxLength={300}
                  className="input flex-1 py-1.5"
                  placeholder={`${LETTERS[j]})`}
                  aria-label={`${i + 1}${LETTERS[j]}`}
                />
              </div>
            ))}
            {q.options.length < 4 && (
              <button type="button" onClick={() => update(i, { options: [...q.options, ""] })} className="ml-6 self-start text-sm font-extrabold text-blue">
                + {t.ownText.addOption}
              </button>
            )}
          </fieldset>
        ))}
        {questions.length < 15 && (
          <button type="button" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} className="btn btn-sm self-start">
            <Plus size={16} /> {t.ownText.addQuestion}
          </button>
        )}
        <p className="text-xs font-bold text-muted">{t.ownText.markHint}</p>
      </div>

      <div>
        <label htmlFor="own-count" className="label">{t.ownText.aiCount}</label>
        <select id="own-count" name="count" className="input" value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))}>
          {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <p className="mt-1 text-sm font-extrabold text-blue-dark">
          {fmt(t.ownText.total, { mine: ready.length, ai: aiCount, total: ready.length + aiCount })}
        </p>
      </div>

      <input type="hidden" name="questions" value={JSON.stringify(ready)} />
      <button className="btn btn-blue py-3" disabled={pending || words < 30 || invalid || ready.length + aiCount === 0}>
        <FileText size={18} /> {pending ? t.content.generating : t.ownText.submit}
      </button>
      {invalid && <p className="font-bold text-red-dark">{t.ownText.badQuestion}</p>}
      {state?.error && <p className="font-bold text-red-dark">{errors[state.error] ?? t.common.error}</p>}
    </form>
  );
}
