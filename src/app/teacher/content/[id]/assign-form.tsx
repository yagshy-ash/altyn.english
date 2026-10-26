"use client";

import { useActionState, useState } from "react";
import { assign } from "@/app/actions/teacher";
import type { Dict } from "@/i18n";
import { StudentPicker } from "@/components/student-picker";

export function AssignForm({ contentId, students, t }: { contentId: string; students: { id: string; name: string; level: string }[]; t: Dict }) {
  const [state, action, pending] = useActionState(assign, undefined);
  const [due, setDue] = useState("");
  return (
    <form key={state?.at ?? "f"} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contentId" value={contentId} />
      {state?.ok && <p className="rounded-2xl bg-green-soft p-3 text-sm font-bold text-green-dark">{t.content.assigned}</p>}
      <div>
        <span className="label">{t.content.pickStudents}</span>
        <StudentPicker students={students} />
      </div>
      <div>
        <label htmlFor="due" className="label">{t.content.dueDate}</label>
        <input id="due" type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        <input type="hidden" name="dueAt" value={due ? new Date(due).toISOString() : ""} />
      </div>
      <div>
        <label htmlFor="note" className="label">{t.content.note}</label>
        <input id="note" name="note" className="input" />
      </div>
      {state?.error && <p className="font-bold text-red-dark">{state.error === "pickStudents" ? t.calendar.pickStudents : t.common.error}</p>}
      <button className="btn btn-green py-3" disabled={pending}>{t.content.assign}</button>
    </form>
  );
}
