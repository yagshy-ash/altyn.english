import Link from "next/link";
import type { AppLocale, Dict } from "@/i18n";
import { formatDate, formatDuration } from "@/lib/format";
import { SkillIcon } from "./skill-icon";
import type { Skill } from "@/generated/prisma/enums";

type Item = {
  id: string;
  skill: Skill;
  score: number | null;
  durationSec: number;
  createdAt: Date;
  student: { id: string; name: string };
  content: { id: string; title: string } | null;
};

// "Kim, ne yaptı, kaç puan aldı, ne kadar sürdü"
export function ActivityFeed({ items, t, locale, showStudent = true }: { items: Item[]; t: Dict; locale: AppLocale; showStudent?: boolean }) {
  if (!items.length) return <p className="font-semibold text-muted">{t.teacher.noActivity}</p>;
  return (
    <ul className="flex flex-col">
      {items.map((a) => {
        const score = Math.round(a.score ?? 0);
        return (
          <li key={a.id} className="flex items-center gap-3 border-t-2 border-line py-3 first:border-t-0">
            <SkillIcon skill={a.skill} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {showStudent && (
                  <Link href={`/teacher/students/${a.student.id}`} className="font-black hover:underline">
                    {a.student.name}
                  </Link>
                )}
                {showStudent && " · "}
                <span className="text-muted">{t.skills[a.skill].name}</span>
                {a.content && <> · {a.content.title}</>}
              </p>
              <p className="text-xs font-bold text-muted">
                {formatDate(a.createdAt, locale, true)} · {formatDuration(a.durationSec, locale)}
              </p>
            </div>
            <span className={`chip ${score >= 80 ? "bg-green-soft text-green-dark" : score >= 50 ? "bg-yellow-soft text-yellow-dark" : "bg-red-soft text-red-dark"}`}>
              {score}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
