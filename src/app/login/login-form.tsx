"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import type { Dict } from "@/i18n";

export function LoginForm({ t, closed }: { t: Dict["login"]; closed?: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="label">{t.username}</label>
        <input id="username" name="username" className="input" autoComplete="username" autoCapitalize="none" defaultValue={state?.username} required />
      </div>
      <div>
        <label htmlFor="password" className="label">{t.password}</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-soft px-4 py-3 text-sm font-bold text-red-dark">{t.error}</p>}
      {(state?.closed || (closed && !state)) && (
        <p role="alert" className="rounded-2xl bg-red-soft px-4 py-3 text-sm font-bold text-red-dark">{t.closed}</p>
      )}
      <button className="btn btn-green mt-2 py-3.5 text-base" disabled={pending}>{t.submit}</button>
    </form>
  );
}
