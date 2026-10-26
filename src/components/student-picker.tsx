"use client";

import { useState } from "react";
import { Avatar } from "./avatar";

// Çoklu öğrenci seçimi; form alanı adı "studentIds"
export function StudentPicker({ students, name = "studentIds" }: { students: { id: string; name: string; level: string }[]; name?: string }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const allLevels = [...new Set(students.map((s) => s.level))];
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex flex-col gap-2">
      {allLevels.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {allLevels.map((l) => (
            <button
              key={l}
              type="button"
              className="chip bg-yellow-soft text-yellow-dark"
              onClick={() => setPicked(new Set([...picked, ...students.filter((s) => s.level === l).map((s) => s.id)]))}
            >
              + {l}
            </button>
          ))}
        </div>
      )}
      <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-2xl border-2 border-line p-1">
        {students.map((s) => (
          <li key={s.id}>
            <label className={`flex cursor-pointer items-center gap-2 rounded-xl p-1.5 ${picked.has(s.id) ? "bg-blue-soft" : "hover:bg-bg"}`}>
              <input type="checkbox" name={name} value={s.id} checked={picked.has(s.id)} onChange={() => toggle(s.id)} className="size-4 accent-[var(--blue)]" />
              <Avatar name={s.name} />
              <span className="flex-1 text-sm font-bold">{s.name}</span>
              <span className="text-xs font-extrabold text-muted">{s.level}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
