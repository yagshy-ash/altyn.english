import Link from "next/link";
import { CalendarDays, Check, ExternalLink, Pin, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import {
  aiLevelHistory,
  DAILY_GOAL_MIN,
  feedFor,
  skillProgress,
  studentStats,
  todaySet,
  topMistakes,
  upcomingLessons,
  weekDots,
} from "@/lib/student-data";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { slugOf, SKILLS } from "@/lib/skills";
import { ProgressBar, SKILL_STYLE, SkillIcon } from "@/components/skill-icon";
import { LevelLine } from "@/components/charts";
import type { Skill } from "@/generated/prisma/enums";

const CEFR_NUM: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export default async function StudentHome() {
  const student = await requireStudent();
  const { locale, t } = await getT();
  const [stats, progress, today, week, errors, levels, posts, lessons, assignments] = await Promise.all([
    studentStats(student.id),
    skillProgress(student.id, student.level),
    todaySet(student.id),
    weekDots(student.id),
    topMistakes(student.id),
    aiLevelHistory(student.id),
    feedFor(student),
    upcomingLessons(student.id, 1),
    db.assignment.findMany({
      where: { studentId: student.id, completedAt: null },
      include: { content: { select: { id: true, title: true, skill: true } } },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    }),
  ]);

  const tasks: { label: string; done: boolean; href: string; skill: Skill; extra?: string }[] = [
    { label: t.today.cards, done: today.cards.done, href: "/student/review", skill: "VOCABULARY", extra: `${today.cards.value}/20` },
    { label: t.today.reading, done: today.reading, href: "/student/reading", skill: "READING" },
    { label: t.today.listening, done: today.listening, href: "/student/listening", skill: "LISTENING" },
    { label: t.today.grammar, done: today.grammar, href: "/student/grammar", skill: "GRAMMAR" },
    { label: t.today.produce, done: today.produce, href: "/student/chat", skill: "SPEAKING" },
  ];
  const doneCount = tasks.filter((x) => x.done).length;
  const goalPct = Math.min(100, (stats.todayMin / DAILY_GOAL_MIN) * 100);
  const errMax = Math.max(1, ...errors.map((e) => e.count));
  const aiLevels = levels.filter((l) => l.source === "ai" && CEFR_NUM[l.level]);
  const nextLesson = lessons[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="h1">{fmt(t.student.hello, { name: student.name.split(" ")[0] })}</h1>
            <p className="mt-1 font-semibold text-muted">{t.student.prompt}</p>
          </div>
          <span className="chip bg-yellow-soft px-4 py-2 text-sm text-yellow-dark">
            {t.student.yourLevel}: {t.levels[student.level]}
          </span>
        </div>

        {/* Bugünün seti */}
        <section className="card flex flex-col gap-4 border-b-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="h2">{t.today.title}</h2>
            <span className="chip bg-green-soft text-green-dark">
              {doneCount}/{tasks.length}
            </span>
          </div>
          <ProgressBar value={(doneCount / tasks.length) * 100} />
          {doneCount === tasks.length && <p className="animate-pop text-center text-lg font-black text-orange">{t.today.allDone}</p>}
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li key={task.label}>
                <Link
                  href={task.href}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors ${task.done ? "border-green bg-green-soft" : "border-line hover:bg-bg"}`}
                >
                  {task.done ? (
                    <span className="grid size-8 place-items-center rounded-xl border-b-2 border-green-dark bg-green text-white">
                      <Check size={18} strokeWidth={3.5} />
                    </span>
                  ) : (
                    <SkillIcon skill={task.skill} size="sm" />
                  )}
                  <span className={`flex-1 font-bold ${task.done ? "text-green-dark line-through decoration-2" : ""}`}>{task.label}</span>
                  {task.extra && <span className="text-sm font-extrabold text-muted tabular-nums">{task.extra}</span>}
                  {!task.done && <span className="text-xs font-black tracking-wide text-blue uppercase">{t.today.go} →</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Beceriler */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((s) => {
            const p = progress[s] ?? { total: 0, done: 0 };
            return (
              <Link key={s} href={`/student/${slugOf(s)}`} className="card flex flex-col gap-3 border-b-4 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <SkillIcon skill={s} />
                  <div className="min-w-0">
                    <h3 className="text-lg font-black">{t.skills[s].name}</h3>
                    <p className="truncate text-sm font-semibold text-muted">{t.skills[s].desc}</p>
                  </div>
                </div>
                <ProgressBar value={p.total ? (p.done / p.total) * 100 : 0} className={SKILL_STYLE[s].bar} />
                <span className="text-xs font-extrabold text-muted">{fmt(t.student.progress, { done: p.done, total: p.total })}</span>
              </Link>
            );
          })}
        </section>

        {/* Hata haritası + seviye */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card flex flex-col gap-3">
            <div>
              <h2 className="h2">{t.insights.errorMap}</h2>
              <p className="text-sm font-semibold text-muted">{t.insights.errorMapHint}</p>
            </div>
            {errors.length ? (
              <ul className="flex flex-col gap-3">
                {errors.map((e) => (
                  <li key={e.type} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm font-extrabold">
                      <span>{t.mistakeTypes[e.type] ?? e.type}</span>
                      <span className="text-red tabular-nums">{e.count}</span>
                    </div>
                    <ProgressBar value={(e.count / errMax) * 100} className="bg-red" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-semibold text-muted">{t.insights.noErrors}</p>
            )}
          </section>
          <section className="card flex flex-col gap-2">
            <div>
              <h2 className="h2">{t.insights.levelChart}</h2>
              <p className="text-sm font-semibold text-muted">{t.insights.levelChartHint}</p>
            </div>
            {aiLevels.length ? (
              <LevelLine data={aiLevels.map((l) => ({ label: formatDate(l.createdAt, locale)!.slice(0, 6), level: CEFR_NUM[l.level] }))} />
            ) : (
              <p className="font-semibold text-muted">{t.insights.noLevel}</p>
            )}
          </section>
        </div>
      </div>

      {/* Sağ sütun */}
      <aside className="flex flex-col gap-4">
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black">{t.student.dailyGoal}</h2>
            <span className="text-sm font-extrabold text-muted">{fmt(t.student.goalText, { n: stats.todayMin, goal: DAILY_GOAL_MIN })}</span>
          </div>
          <ProgressBar value={goalPct} className="bg-orange" />
          {goalPct >= 100 && <p className="text-sm font-black text-orange">{t.student.goalDone}</p>}
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {week.map((d) => (
              <div key={d.date.toISOString()} className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-8 place-items-center rounded-full text-sm ${d.minutes > 0 ? "bg-orange text-white" : "bg-line"} ${d.today ? "ring-2 ring-orange ring-offset-2 ring-offset-sheet" : ""}`}
                >
                  {d.minutes > 0 ? "🔥" : ""}
                </span>
                <span className="text-[10px] font-extrabold text-muted uppercase">{formatWeekday(d.date, locale).slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </section>

        {stats.due > 0 && (
          <Link href="/student/review" className="card flex items-center gap-3 border-b-4 border-purple bg-purple-soft">
            <span className="grid size-12 place-items-center rounded-2xl border-b-4 border-purple-dark bg-purple text-white">
              <RotateCcw size={24} strokeWidth={2.6} />
            </span>
            <span className="flex-1 font-black text-purple-dark">{fmt(t.student.reviewDue, { n: stats.due })}</span>
          </Link>
        )}

        <section className="card flex flex-col gap-2">
          <h2 className="font-black">{t.student.nextLesson}</h2>
          {nextLesson ? (
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-soft text-blue">
                <CalendarDays size={24} />
              </span>
              <div className="min-w-0">
                <p className="font-black">{nextLesson.title}</p>
                <p className="text-sm font-bold text-muted">
                  {formatWeekday(nextLesson.startsAt, locale, "long")} · {formatTime(nextLesson.startsAt, locale)}
                </p>
                {nextLesson.link && (
                  <a href={nextLesson.link} target="_blank" rel="noreferrer" className="btn btn-blue btn-sm mt-2">
                    <ExternalLink size={14} /> {t.calendar.join}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted">{t.student.noLesson}</p>
          )}
        </section>

        <section className="card flex flex-col gap-2">
          <h2 className="font-black">{t.student.assignments}</h2>
          {assignments.length ? (
            <ul className="flex flex-col gap-2">
              {assignments.map((a) => (
                <li key={a.id}>
                  <Link href={`/student/${slugOf(a.content.skill)}/${a.content.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-line p-2.5 hover:bg-bg">
                    <SkillIcon skill={a.content.skill} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{a.content.title}</span>
                      {a.dueAt && <span className="text-xs font-bold text-muted">{formatDate(a.dueAt, locale)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-semibold text-muted">{t.student.noAssignments}</p>
          )}
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="font-black">{t.student.feed}</h2>
          {posts.length ? (
            posts.map((p) => (
              <article key={p.id} className={`rounded-2xl p-3 ${p.pinned ? "bg-yellow-soft" : "bg-bg"}`}>
                {p.pinned && (
                  <span className="mb-1 flex items-center gap-1 text-[11px] font-black text-yellow-dark uppercase">
                    <Pin size={12} /> {t.posts.pinned}
                  </span>
                )}
                <p className="text-sm font-semibold whitespace-pre-wrap">{p.body}</p>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold break-all text-blue">
                    <ExternalLink size={13} /> {p.link}
                  </a>
                )}
                <p className="mt-1 text-[11px] font-bold text-muted">{formatDate(p.createdAt, locale, true)}</p>
              </article>
            ))
          ) : (
            <p className="text-sm font-semibold text-muted">{t.student.noPosts}</p>
          )}
        </section>
      </aside>
    </div>
  );
}
