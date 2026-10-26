"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudent } from "@/app/actions/students";
import { LOCALES, getDict, type AppLocale, type Dict } from "@/i18n";
import { Level } from "@/generated/prisma/enums";

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => chars[b % chars.length]).join("");
}

// Şifre sadece tarayıcıda üretilir; sunucuda üretilse hydration uyuşmazlığı olur
function PasswordField({ label }: { label: string }) {
  const pw = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pw.current && !pw.current.value) pw.current.value = randomPassword();
  }, []);
  return (
    <div className="flex gap-2">
      <input id="password" name="password" ref={pw} className="input font-mono" required />
      <button type="button" className="btn shrink-0" onClick={() => pw.current && (pw.current.value = randomPassword())}>
        {label}
      </button>
    </div>
  );
}

export function AddStudentForm({ t, defaultLocale }: { t: Dict; defaultLocale: AppLocale }) {
  const [state, action, pending] = useActionState(createStudent, undefined);
  const errors = state && !state.ok ? state.errors : {};
  const err = (k: keyof typeof errors) =>
    errors[k] && <p className="mt-1 text-sm text-red-dark">{t.students[errors[k]]}</p>;

  return (
    <div className="flex flex-col gap-4">
      {state?.ok && (
        <div role="status" className="rounded-xl bg-green-soft p-3 text-sm">
          <p className="font-semibold text-green-dark">{t.students.created}</p>
          <p className="mt-2 font-mono">
            {state.name}
            <br />
            {t.students.username}: <b>{state.username}</b>
            <br />
            {t.students.password}: <b>{state.password}</b>
          </p>
        </div>
      )}
      {/* key: başarılı kayıttan sonra formu sıfırla */}
      <form key={state?.ok ? state.username : "form"} action={action} className="flex flex-col gap-3.5">
        <div>
          <label htmlFor="name" className="label">{t.students.name}</label>
          <input id="name" name="name" className="input" required />
          {err("name")}
        </div>
        <div>
          <label htmlFor="username" className="label">{t.students.username}</label>
          <input id="username" name="username" className="input" autoCapitalize="none" required />
          {err("username")}
        </div>
        <div>
          <label htmlFor="password" className="label">{t.students.password}</label>
          <PasswordField label={t.students.generate} />
          {err("password")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="level" className="label">{t.students.level}</label>
            <select id="level" name="level" className="input" defaultValue="A1">
              {Object.values(Level).map((l) => (
                <option key={l} value={l}>{t.levels[l]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="locale" className="label">{t.students.locale}</label>
            <select id="locale" name="locale" className="input" defaultValue={defaultLocale}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>{getDict(l).langName}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="note" className="label">{t.students.note}</label>
          <textarea id="note" name="note" rows={2} className="input" />
        </div>
        <button className="btn btn-green py-2.5" disabled={pending}>{t.students.add}</button>
      </form>
    </div>
  );
}
