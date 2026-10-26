"use client";

import { useActionState, useState } from "react";
import { createLesson } from "@/app/actions/teacher";
import type { Dict } from "@/i18n";
import { StudentPicker } from "@/components/student-picker";

// datetime-local tarayıcının saat dilimindedir; sunucuya ISO (UTC) olarak gönderilir
export function LessonForm({ students, t }: { students: { id: string; name: string; level: string }[]; t: Dict }) {
  const [state, action, pending] = useActionState(createLesson, undefined);
  const [local, setLocal] = useState("");
  const iso = local ? new Date(local).toISOString() : "";

  return (
    <form key={state?.at ?? "f"} action={action} className="flex flex-col gap-3.5">
      {state?.ok && <p className="rounded-2xl bg-green-soft p-3 text-sm font-bold text-green-dark">{t.calendar.created}</p>}
      <div>
        <label htmlFor="title" className="label">{t.calendar.lessonTitle}</label>
        <input id="title" name="title" className="input" placeholder={t.calendar.lessonTitlePlaceholder} required />
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label htmlFor="when" className="label">{t.calendar.date}</label>
          <input id="when" type="datetime-local" className="input" value={local} onChange={(e) => setLocal(e.target.value)} required />
          <input type="hidden" name="startsAt" value={iso} />
        </div>
        <div>
          <label htmlFor="durationMin" className="label">{t.calendar.duration}</label>
          <input id="durationMin" name="durationMin" type="number" min={5} max={600} defaultValue={60} className="input" />
        </div>
      </div>
      <div>
        <span className="label">{t.calendar.studentsLabel}</span>
        <StudentPicker students={students} />
      </div>
      <div>
        <label htmlFor="link" className="label">{t.calendar.link}</label>
        <input id="link" name="link" type="url" className="input" placeholder="https://" />
      </div>
      <div>
        <label htmlFor="note" className="label">{t.calendar.note}</label>
        <textarea id="note" name="note" rows={2} className="input" />
      </div>
      {state?.error && <p className="font-bold text-red-dark">{state.error === "pickStudents" ? t.calendar.pickStudents : t.common.error}</p>}
      <button className="btn btn-green py-3" disabled={pending}>{t.calendar.addLesson}</button>
    </form>
  );
}
