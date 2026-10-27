import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Flame, Gem, Target, Timer, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { getDict } from "@/i18n";
import { daysAgo, formatDate, formatDuration, formatTime, formatWeekday } from "@/lib/format";
import { dailyMinutes, isOnline, secondsSince, streakFor, xpFor } from "@/lib/stats";
import { recentActivity } from "@/lib/teacher-data";
import { SKILLS } from "@/lib/skills";
import { SKILL_HEX } from "@/components/skill-icon";
import { ProgressBar } from "@/components/skill-icon";
import { Avatar } from "@/components/avatar";
import { ActivityFeed } from "@/components/activity-feed";
import { LevelLine, MinutesBars, ScoreLine, SkillBars } from "@/components/charts";
import { StudentControls } from "./student-controls";

const CEFR_NUM: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export default async function StudentProfile({ params }: PageProps<"/teacher/students/[id]">) {
  const { id } = await params;
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const student = await db.user.findFirst({ where: { id, teacherId: teacher.id } });
  if (!student) notFound();

  const [total, week, streak, xp, minutes30, bySkill, trend, levels, mistakeTypes, recentMistakes, sessions, activity, byArea, assignments, lessons] =
    await Promise.all([
      db.activityDay.aggregate({ where: { studentId: id }, _sum: { seconds: true } }),
      secondsSince([id], daysAgo(6)),
      streakFor(id),
      xpFor(id),
      dailyMinutes({ studentId: id }, 30),
      db.attempt.groupBy({ by: ["skill"], where: { studentId: id }, _avg: { score: true }, _count: { _all: true } }),
      db.attempt.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 30, select: { score: true, createdAt: true } }),
      db.levelSnapshot.findMany({ where: { studentId: id }, orderBy: { createdAt: "asc" }, take: 60 }),
      db.mistake.groupBy({ by: ["type"], where: { studentId: id }, _count: { _all: true }, orderBy: { _count: { type: "desc" } }, take: 8 }),
      db.mistake.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
      db.onlineSession.findMany({ where: { studentId: id }, orderBy: { startedAt: "desc" }, take: 15 }),
      recentActivity({ studentId: id }, 20),
      db.activityDay.groupBy({ by: ["area"], where: { studentId: id, day: { gte: daysAgo(29) } }, _sum: { seconds: true } }),
      db.assignment.findMany({ where: { studentId: id }, include: { content: { select: { title: true, skill: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
      db.lesson.findMany({ where: { students: { some: { id } }, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 5 }),
    ]);

  const attempts = bySkill.reduce((n, s) => n + s._count._all, 0);
  const avg = attempts ? bySkill.reduce((n, s) => n + (s._avg.score ?? 0) * s._count._all, 0) / attempts : null;
  const online = isOnline(student.lastActiveAt);
  const mistakeMax = Math.max(1, ...mistakeTypes.map((m) => m._count._all));
  const areaTotal = byArea.reduce((n, a) => n + (a._sum.seconds ?? 0), 0);
  const areaNames: Record<string, string> = {
    home: t.nav.home,
    review: t.nav.review,
    chat: t.nav.chat,
    lessons: t.nav.lessons,
    watch: t.nav.watch,
    ...Object.fromEntries(SKILLS.map((s) => [s.toLowerCase(), t.skills[s].name])),
  };

  const tiles = [
    { icon: Clock, label: t.students.totalTime, value: formatDuration(total._sum.seconds ?? 0, locale), cls: "bg-blue-soft text-blue-dark" },
    { icon: Timer, label: t.students.weekTime, value: formatDuration(week[id] ?? 0, locale), cls: "bg-orange-soft text-orange-dark" },
    { icon: Target, label: t.students.attempts, value: attempts, cls: "bg-purple-soft text-purple-dark" },
    { icon: Trophy, label: t.students.avgScore, value: avg === null ? "—" : `${Math.round(avg)}%`, cls: "bg-green-soft text-green-dark" },
    { icon: Flame, label: t.students.streak, value: streak, cls: "bg-orange-soft text-orange" },
    { icon: Gem, label: "XP", value: xp, cls: "bg-blue-soft text-blue" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/teacher/students" className="flex w-fit items-center gap-1 font-extrabold text-muted hover:text-ink">
        <ArrowLeft size={18} /> {t.students.title}
      </Link>

      <header className="card flex flex-wrap items-center gap-5 border-b-4">
        <Avatar name={student.name} online={online} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="h1">{student.name}</h1>
          <p className="font-bold text-muted">
            @{student.username} · {getDict(student.locale).langName} · {t.students.joined}: {formatDate(student.createdAt, locale)}
          </p>
          <p className={`mt-1 font-extrabold ${online ? "text-green-dark" : "text-muted"}`}>
            {online ? `● ${t.common.online}` : `${t.students.lastActive}: ${formatDate(student.lastActiveAt, locale, true) ?? t.common.never}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip bg-yellow-soft px-4 py-2 text-base text-yellow-dark">{t.levels[student.level]}</span>
          {!student.active && <span className="chip bg-red-soft px-4 py-2 text-base text-red-dark">{t.students.inactive}</span>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.cls}`}>
              <s.icon size={20} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-black tabular-nums">{s.value}</p>
              <p className="truncate text-[11px] font-extrabold tracking-wide text-muted uppercase">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="card">
            <h2 className="h2 mb-3">{t.students.minutesChart}</h2>
            <MinutesBars data={minutes30} />
            {areaTotal > 0 && (
              <div className="mt-4 flex h-4 overflow-hidden rounded-full" title="30 gün">
                {byArea.map((a) => (
                  <div
                    key={a.area}
                    title={`${areaNames[a.area] ?? a.area}: ${formatDuration(a._sum.seconds ?? 0, locale)}`}
                    style={{ width: `${((a._sum.seconds ?? 0) / areaTotal) * 100}%`, background: SKILL_HEX[a.area.toUpperCase() as keyof typeof SKILL_HEX] ?? "var(--line)" }}
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {byArea.map((a) => (
                <span key={a.area} className="text-xs font-bold text-muted">
                  {areaNames[a.area] ?? a.area}: {formatDuration(a._sum.seconds ?? 0, locale)}
                </span>
              ))}
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card">
              <h2 className="h2 mb-3">{t.students.scoreBySkill}</h2>
              {bySkill.length ? (
                <SkillBars data={SKILLS.map((s) => ({ name: t.skills[s].name, score: Math.round(bySkill.find((b) => b.skill === s)?._avg.score ?? 0), color: SKILL_HEX[s] }))} />
              ) : (
                <p className="font-semibold text-muted">{t.students.noWork}</p>
              )}
            </section>
            <section className="card">
              <h2 className="h2 mb-3">{t.students.scoreTrend}</h2>
              {trend.length ? (
                <ScoreLine data={[...trend].reverse().map((a) => ({ label: formatDate(a.createdAt, locale)!.slice(0, 6), score: Math.round(a.score ?? 0) }))} />
              ) : (
                <p className="font-semibold text-muted">{t.students.noWork}</p>
              )}
            </section>
          </div>

          <section className="card">
            <h2 className="h2 mb-2">{t.students.recentWork}</h2>
            <ActivityFeed items={activity} t={t} locale={locale} showStudent={false} />
            {activity.some((a) => a.skill === "WRITING" || a.skill === "SPEAKING") && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activity
                  .filter((a) => a.skill === "WRITING" || a.skill === "SPEAKING")
                  .slice(0, 6)
                  .map((a) => (
                    <Link key={a.id} href={`/teacher/students/${id}/attempts/${a.id}`} className="btn btn-sm">
                      {t.students.feedback}: {a.content?.title ?? t.nav.chat} · {formatDate(a.createdAt, locale)}
                    </Link>
                  ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card flex flex-col gap-3">
              <h2 className="h2">{t.students.mistakes}</h2>
              {mistakeTypes.length ? (
                mistakeTypes.map((m) => (
                  <div key={m.type} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm font-extrabold">
                      <span>{t.mistakeTypes[m.type] ?? m.type}</span>
                      <span className="text-red tabular-nums">{m._count._all}</span>
                    </div>
                    <ProgressBar value={(m._count._all / mistakeMax) * 100} className="bg-red" />
                  </div>
                ))
              ) : (
                <p className="font-semibold text-muted">{t.common.noData}</p>
              )}
            </section>
            <section className="card flex flex-col gap-1">
              <h2 className="h2 mb-2">{t.students.recentMistakes}</h2>
              {recentMistakes.length ? (
                recentMistakes.map((m) => (
                  <div key={m.id} className="border-t-2 border-line py-2 first:border-t-0">
                    <p className="text-sm font-bold">
                      <span className="text-red line-through">{m.wrong}</span> → <span className="text-green-dark">{m.right}</span>
                    </p>
                    {m.explanation && <p className="line-clamp-2 text-xs font-semibold text-muted">{m.explanation}</p>}
                  </div>
                ))
              ) : (
                <p className="font-semibold text-muted">{t.common.noData}</p>
              )}
            </section>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="card">
            <h2 className="mb-3 font-black">{t.students.controls}</h2>
            <StudentControls studentId={student.id} username={student.username} level={student.level} active={student.active} t={t} />
            {student.note && <p className="mt-4 border-l-4 border-yellow pl-3 text-sm font-semibold text-muted">{student.note}</p>}
          </section>

          <section className="card">
            <h2 className="mb-2 font-black">{t.students.sessions}</h2>
            {sessions.length ? (
              <ul className="flex flex-col">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 border-t-2 border-line py-2 text-sm first:border-t-0">
                    <span className="font-bold">
                      {formatWeekday(s.startedAt, locale)} · {formatTime(s.startedAt, locale)}–{formatTime(s.lastSeenAt, locale)}
                    </span>
                    <span className="chip bg-blue-soft text-blue-dark">{formatDuration(s.seconds, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-muted">{t.common.noData}</p>
            )}
          </section>

          <section className="card">
            <h2 className="mb-2 font-black">{t.students.levelHistory}</h2>
            {levels.length > 1 ? (
              <LevelLine data={levels.filter((l) => CEFR_NUM[l.level]).map((l) => ({ label: formatDate(l.createdAt, locale)!.slice(0, 6), level: CEFR_NUM[l.level] }))} height={160} />
            ) : null}
            <ul className="mt-2 flex flex-col gap-1">
              {levels.slice(-5).reverse().map((l) => (
                <li key={l.id} className="flex justify-between text-sm font-bold">
                  <span>
                    {l.level} <span className="text-muted">· {l.source === "ai" ? t.students.aiLevel : t.students.teacherLevel}</span>
                  </span>
                  <span className="text-muted">{formatDate(l.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="mb-2 font-black">{t.students.assignmentsTitle}</h2>
            {assignments.length ? (
              <ul className="flex flex-col gap-1">
                {assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm font-bold">
                    <span className="truncate">{a.content.title}</span>
                    <span className={`chip ${a.completedAt ? "bg-green-soft text-green-dark" : a.dueAt && a.dueAt < new Date() ? "bg-red-soft text-red-dark" : "bg-yellow-soft text-yellow-dark"}`}>
                      {a.completedAt ? t.assignments.completed : a.dueAt && a.dueAt < new Date() ? t.assignments.overdue : t.assignments.open}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-muted">{t.assignments.empty}</p>
            )}
          </section>

          <section className="card">
            <h2 className="mb-2 font-black">{t.students.upcomingLessons}</h2>
            {lessons.length ? (
              lessons.map((l) => (
                <p key={l.id} className="text-sm font-bold">
                  {formatWeekday(l.startsAt, locale)} {formatTime(l.startsAt, locale)} · {l.title}
                </p>
              ))
            ) : (
              <p className="text-sm font-semibold text-muted">{t.student.noUpcoming}</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
