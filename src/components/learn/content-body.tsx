"use client";

import type { AppLocale, Dict } from "@/i18n";
import type { Skill } from "@/generated/prisma/enums";
import type { GrammarBody, ListeningBody, ReadingBody, SpeakingBody, VocabularyBody, WritingBody } from "@/lib/content-schemas";
import { Quiz } from "./quiz";
import { Listening } from "./listening";
import { VocabSet } from "./vocab-set";
import { WritingTask } from "./writing-task";
import { SpeakingTask } from "./speaking-task";
import { SpeakButton } from "./speak-button";

// Her becerinin çalışma ekranı. `preview` öğretmen önizlemesi içindir (kaydetmez, sadece gösterir).
export function ContentBody({
  content,
  locale,
  t,
  added = false,
  preview = false,
}: {
  content: { id: string; skill: Skill; body: unknown };
  locale: AppLocale;
  t: Dict;
  added?: boolean;
  preview?: boolean;
}) {
  const back = `/student/${content.skill.toLowerCase()}`;
  switch (content.skill) {
    case "READING": {
      const b = content.body as ReadingBody;
      return (
        <div className="flex flex-col gap-5">
          <article className="card flex flex-col gap-4 p-6 font-read text-lg leading-relaxed sm:p-8">
            {b.passage.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <Glossary items={b.glossary} locale={locale} t={t} />
          <h2 className="h2">{t.quiz.questions}</h2>
          {preview ? <AnswerKey items={b.questions} locale={locale} /> : <Quiz contentId={content.id} items={b.questions} locale={locale} t={t} backHref={back} />}
        </div>
      );
    }
    case "LISTENING": {
      const b = content.body as ListeningBody;
      return preview ? (
        <div className="flex flex-col gap-4">
          <article className="card flex flex-col gap-2 font-read text-lg">{b.script.map((s, i) => <p key={i}>{s}</p>)}</article>
          <AnswerKey items={b.questions} locale={locale} />
        </div>
      ) : (
        <Listening contentId={content.id} body={b} locale={locale} t={t} />
      );
    }
    case "GRAMMAR": {
      const b = content.body as GrammarBody;
      return (
        <div className="flex flex-col gap-5">
          <section className="card flex flex-col gap-2 border-b-4 border-green bg-green-soft">
            <h2 className="h2">{t.quiz.rule}</h2>
            <p className="text-[17px] leading-relaxed font-semibold whitespace-pre-wrap">{b.explanation[locale]}</p>
          </section>
          <section className="card flex flex-col gap-1">
            <h2 className="h2 mb-2">{t.quiz.examples}</h2>
            {b.examples.map((e, i) => (
              <div key={i} className="flex items-start gap-3 border-t-2 border-line py-3 first:border-t-0">
                <SpeakButton text={e.en} label={t.vocab.listen} />
                <div>
                  <p className="font-read text-lg">{e.en}</p>
                  <p className="font-semibold text-muted">{e[locale]}</p>
                </div>
              </div>
            ))}
          </section>
          <h2 className="h2">{t.quiz.exercises}</h2>
          {preview ? <AnswerKey items={b.exercises} locale={locale} /> : <Quiz contentId={content.id} items={b.exercises} locale={locale} t={t} backHref={back} />}
        </div>
      );
    }
    case "VOCABULARY": {
      const b = content.body as VocabularyBody;
      return preview ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {b.words.map((w) => (
            <li key={w.word} className="card p-3">
              <b>{w.word}</b> <i className="text-muted">{w.pos}</i> — {w[locale]}
              <p className="text-sm text-muted">{w.example}</p>
            </li>
          ))}
        </ul>
      ) : (
        <VocabSet contentId={content.id} body={b} locale={locale} t={t} added={added} />
      );
    }
    case "WRITING": {
      const b = content.body as WritingBody;
      return preview ? <TaskPreview task={b.task[locale]} en={b.taskEn} hints={b.hints} /> : <WritingTask contentId={content.id} body={b} locale={locale} t={t} />;
    }
    case "SPEAKING": {
      const b = content.body as SpeakingBody;
      return preview ? <TaskPreview task={b.task[locale]} en={b.questionEn} hints={b.hints} /> : <SpeakingTask contentId={content.id} body={b} locale={locale} t={t} />;
    }
  }
}

function Glossary({ items, locale, t }: { items: ReadingBody["glossary"]; locale: AppLocale; t: Dict }) {
  return (
    <details className="card" open>
      <summary className="cursor-pointer font-black">{t.quiz.glossary}</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <div key={g.word} className="flex items-center gap-2 rounded-2xl bg-bg p-2.5">
            <SpeakButton text={g.word} label={t.vocab.listen} />
            <div className="min-w-0">
              <dt className="font-extrabold">{g.word}</dt>
              <dd className="text-sm font-semibold text-muted">{g[locale]}</dd>
            </div>
          </div>
        ))}
      </dl>
    </details>
  );
}

function AnswerKey({ items, locale }: { items: ReadingBody["questions"]; locale: AppLocale }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((q, i) => (
        <li key={i} className="card p-4">
          <p className="font-extrabold">{i + 1}. {q.question}</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {q.options.map((o, j) => (
              <li key={j} className={`rounded-xl px-3 py-1.5 font-semibold ${j === q.answer ? "bg-green-soft text-green-dark" : "bg-bg"}`}>{o}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{q.explanation[locale]}</p>
        </li>
      ))}
    </ol>
  );
}

function TaskPreview({ task, en, hints }: { task: string; en: string; hints: string[] }) {
  return (
    <section className="card flex flex-col gap-2">
      <p className="text-lg font-extrabold">{task}</p>
      <p className="font-read text-muted italic">{en}</p>
      <div className="flex flex-wrap gap-2">{hints.map((h) => <span key={h} className="chip bg-bg">{h}</span>)}</div>
    </section>
  );
}
