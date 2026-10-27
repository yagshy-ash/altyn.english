"use client";

import { useActionState, useState } from "react";
import { FileText } from "lucide-react";
import { createFromText } from "@/app/actions/teacher";
import { fmt, type Dict } from "@/i18n";
import { MAX_TEXT_CHARS } from "@/lib/content-schemas";
import { Level } from "@/generated/prisma/enums";

export function TextForm({ t, defaultLevel }: { t: Dict; defaultLevel?: Level }) {
  const [state, action, pending] = useActionState(createFromText, undefined);
  const [words, setWords] = useState(0);
  const errors: Record<string, string> = {
    tooShort: t.ownText.tooShort,
    tooLong: fmt(t.ownText.tooLong, { n: MAX_TEXT_CHARS }),
    ai: t.common.aiOff,
  };
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <p className="text-sm font-semibold text-muted">{t.ownText.desc}</p>
      <div>
        <label htmlFor="own-title" className="label">{t.ownText.title}</label>
        <input id="own-title" name="title" maxLength={200} className="input" placeholder={t.ownText.titlePlaceholder} />
      </div>
      <div className="grid grid-cols-3 gap-2">
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
        <div>
          <label htmlFor="own-count" className="label">{t.ownText.count}</label>
          <select id="own-count" name="count" className="input px-2" defaultValue="6">
            {[4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
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
          rows={10}
          maxLength={MAX_TEXT_CHARS}
          className="input font-read font-normal"
          placeholder={t.ownText.textPlaceholder}
          onChange={(e) => setWords(e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0)}
        />
        <p className="mt-1 text-xs font-bold text-muted">{fmt(t.writing.wordCount, { n: words })}</p>
      </div>
      <button className="btn btn-blue py-3" disabled={pending || words < 30}>
        <FileText size={18} /> {pending ? t.content.generating : t.ownText.submit}
      </button>
      {state?.error && <p className="font-bold text-red-dark">{errors[state.error] ?? t.common.error}</p>}
    </form>
  );
}
