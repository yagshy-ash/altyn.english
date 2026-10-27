"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { generate } from "@/app/actions/teacher";
import type { Dict } from "@/i18n";
import { Level, Skill } from "@/generated/prisma/enums";

export function GenerateForm({ t, defaultLevel, defaultSkill }: { t: Dict; defaultLevel?: Level; defaultSkill?: Skill }) {
  const [state, action, pending] = useActionState(generate, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="skill" className="label">{t.nav.content}</label>
          <select id="skill" name="skill" className="input" defaultValue={defaultSkill ?? "READING"}>
            {Object.values(Skill).map((s) => (
              <option key={s} value={s}>{t.skills[s].name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="level" className="label">{t.common.level}</label>
          <select id="level" name="level" className="input" defaultValue={defaultLevel ?? "A1"}>
            {Object.values(Level).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="topic" className="label">{t.content.topic}</label>
        <input id="topic" name="topic" className="input" placeholder={t.content.topicPlaceholder} />
      </div>
      <button className="btn btn-green py-3" disabled={pending}>
        <Sparkles size={18} /> {pending ? t.content.generating : t.content.generate}
      </button>
      {state?.error && <p className="font-bold text-red-dark">{state.error === "ai" ? t.common.aiOff : t.common.error}</p>}
    </form>
  );
}
