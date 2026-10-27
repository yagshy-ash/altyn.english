"use client";

import { useState, useTransition } from "react";
import { deleteStudent, resetStudentPassword, toggleStudentActive, updateStudentLevel } from "@/app/actions/students";
import { Level } from "@/generated/prisma/enums";
import { fmt, type Dict } from "@/i18n";

export function StudentControls({
  studentId,
  username,
  level,
  active,
  t,
}: {
  studentId: string;
  username: string;
  level: Level;
  active: boolean;
  t: Dict;
}) {
  const [pending, start] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="level" className="label">{t.students.level}</label>
        <select
          id="level"
          className="input"
          defaultValue={level}
          disabled={pending}
          onChange={(e) => start(() => updateStudentLevel(studentId, e.target.value))}
        >
          {Object.values(Level).map((l) => (
            <option key={l} value={l}>{t.levels[l]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={pending} onClick={() => start(async () => setNewPassword(await resetStudentPassword(studentId)))}>
          {t.students.resetPassword}
        </button>
        <button
          className={`btn ${active ? "" : "btn-green"}`}
          disabled={pending}
          onClick={() => {
            if (active && !confirm(fmt(t.students.deactivateConfirm, { name: username }))) return;
            start(() => toggleStudentActive(studentId));
          }}
        >
          {active ? t.students.deactivate : t.students.activate}
        </button>
        <button
          className="btn btn-red"
          disabled={pending}
          onClick={() => {
            if (prompt(fmt(t.students.deleteConfirm, { name: username }))?.trim().toLowerCase() !== username) return;
            start(() => deleteStudent(studentId));
          }}
        >
          {t.students.deleteStudent}
        </button>
      </div>
      <p className="text-xs font-semibold text-muted">{t.students.accessHint}</p>

      {newPassword && (
        <p role="status" className="rounded-xl bg-green-soft p-3 text-sm">
          {t.students.passwordReset} <b className="font-mono">{newPassword}</b>
        </p>
      )}
    </div>
  );
}
