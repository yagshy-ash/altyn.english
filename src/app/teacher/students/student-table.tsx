import Link from "next/link";
import { Flame } from "lucide-react";
import type { AppLocale, Dict } from "@/i18n";
import { formatDate, formatDuration } from "@/lib/format";
import type { StudentRow } from "@/lib/teacher-data";
import { Avatar } from "@/components/avatar";

export function StudentTable({ students, t, locale }: { students: StudentRow[]; t: Dict; locale: AppLocale }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="text-xs font-extrabold tracking-wide text-muted uppercase">
            <th className="px-5 py-2">{t.students.name}</th>
            <th className="px-2 py-2">{t.students.level}</th>
            <th className="px-2 py-2">{t.students.lastActive}</th>
            <th className="px-2 py-2 text-right">{t.students.weekTime}</th>
            <th className="px-2 py-2 text-right">{t.students.avgScore}</th>
            <th className="px-2 py-2 text-right">{t.students.attempts}</th>
            <th className="px-5 py-2 text-right">{t.students.streak}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t-2 border-line hover:bg-bg">
              <td className="px-5 py-3">
                <Link href={`/teacher/students/${s.id}`} className="flex items-center gap-3">
                  <Avatar name={s.name} online={s.online} />
                  <span className="min-w-0">
                    <span className="block font-black">{s.name}</span>
                    <span className="text-xs font-bold text-muted">
                      @{s.username}
                      {!s.active && <span className="ml-2 text-red-dark">{t.students.inactive}</span>}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-2 py-3">
                <span className="chip bg-yellow-soft text-yellow-dark">{s.level}</span>
              </td>
              <td className="px-2 py-3 text-sm font-bold">
                {s.online ? <span className="text-green-dark">● {t.common.online}</span> : <span className="text-muted">{formatDate(s.lastActiveAt, locale, true) ?? t.common.never}</span>}
              </td>
              <td className="px-2 py-3 text-right font-bold tabular-nums">{formatDuration(s.weekSeconds, locale)}</td>
              <td className="px-2 py-3 text-right font-bold tabular-nums">{s.avgScore === null ? "—" : `${Math.round(s.avgScore)}%`}</td>
              <td className="px-2 py-3 text-right font-bold tabular-nums">{s.attempts}</td>
              <td className="px-5 py-3 text-right">
                <span className={`inline-flex items-center gap-1 font-black ${s.streak ? "text-orange" : "text-muted"}`}>
                  <Flame size={16} fill={s.streak ? "currentColor" : "none"} /> {s.streak}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
