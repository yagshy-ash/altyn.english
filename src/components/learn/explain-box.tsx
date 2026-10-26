"use client";

import { useState, useTransition } from "react";
import { explain } from "@/app/actions/learning";
import type { Explanation } from "@/lib/ai";
import type { Dict } from "@/i18n";

export function ExplainBox({ t }: { t: Dict["explain"] & { error?: string } }) {
  const [text, setText] = useState("");
  const [out, setOut] = useState<Explanation | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-3">
        <p className="font-bold text-muted">{t.desc}</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={t.placeholder} className="input font-read font-normal" />
        <button
          className="btn btn-blue self-end px-8"
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              setFailed(false);
              try {
                setOut(await explain(text));
              } catch {
                setFailed(true);
              }
            })
          }
        >
          {pending ? t.working : t.go}
        </button>
        {failed && <p className="font-bold text-red-dark">{t.error}</p>}
      </section>

      {out && (
        <div className="animate-pop flex flex-col gap-4">
          <section className="card border-b-4 border-blue bg-blue-soft">
            <h3 className="eyebrow mb-1">{t.summary}</h3>
            <p className="text-lg font-semibold">{out.summary}</p>
          </section>
          <section className="card flex flex-col gap-1">
            <h3 className="h2 mb-2">{t.sentences}</h3>
            {out.sentences.map((s, i) => (
              <div key={i} className="border-t-2 border-line py-3 first:border-t-0">
                <p className="font-read text-lg">{s.en}</p>
                <p className="font-semibold text-blue-dark">{s.meaning}</p>
              </div>
            ))}
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="card">
              <h3 className="h2 mb-3">{t.vocab}</h3>
              <dl className="flex flex-col gap-2">
                {out.vocab.map((v) => (
                  <div key={v.word}>
                    <dt className="font-black">{v.word}</dt>
                    <dd className="text-sm font-semibold text-muted">{v.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="card">
              <h3 className="h2 mb-3">{t.grammar}</h3>
              <dl className="flex flex-col gap-2">
                {out.grammar.map((g) => (
                  <div key={g.pattern}>
                    <dt className="font-black">{g.pattern}</dt>
                    <dd className="text-sm font-semibold text-muted">{g.note}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
