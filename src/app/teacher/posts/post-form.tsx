"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { createPost } from "@/app/actions/teacher";
import { fmt, type Dict } from "@/i18n";
import { Level } from "@/generated/prisma/enums";

export function PostForm({ students, t }: { students: { id: string; name: string }[]; t: Dict }) {
  const [state, action, pending] = useActionState(createPost, undefined);
  return (
    <form key={state?.at ?? "f"} action={action} className="flex flex-col gap-3">
      <textarea name="body" rows={4} required placeholder={t.posts.placeholder} className="input font-normal" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="audience" className="label">{t.posts.audience}</label>
          <select id="audience" name="audience" className="input" defaultValue="all">
            <option value="all">{t.posts.everyone}</option>
            <optgroup label={t.students.level}>
              {Object.values(Level).map((l) => (
                <option key={l} value={`level:${l}`}>{fmt(t.posts.levelOnly, { level: l })}</option>
              ))}
            </optgroup>
            <optgroup label={t.students.title}>
              {students.map((s) => (
                <option key={s.id} value={`student:${s.id}`}>{s.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label htmlFor="link" className="label">{t.posts.link}</label>
          <input id="link" name="link" type="url" className="input" placeholder="https://" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="pinned" className="size-4 accent-[var(--yellow)]" /> {t.posts.pin}
        </label>
        <button className="btn btn-blue px-8" disabled={pending}>
          <Send size={16} /> {t.posts.publish}
        </button>
      </div>
      {state?.error && <p className="font-bold text-red-dark">{t.common.error}</p>}
    </form>
  );
}
