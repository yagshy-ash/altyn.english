import Link from "next/link";
import { AlertTriangle, CalendarDays, Clock, ClipboardList, ExternalLink, UserPlus, Users, Wifi } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDuration, formatTime, zoneDayStart, dayKey } from "@/lib/format";
import { dailyMinutes, daysSince } from "@/lib/stats";
import { recentActivity, studentRows } from "@/lib/teacher-data";
import { ActivityFeed } from "@/components/activity-feed";
import { MinutesBars } from "@/components/charts";
import { Avatar } from "@/components/avatar";

export default async function TeacherOverview() {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const rows = await studentRows(teacher.id);
  const ids = rows.map((r) => r.id);
  const dayStart = zoneDayStart();
  const dayEnd = zoneDayStart(dayKey(new Date(dayStart.getTime() + 36 * 3600_000)));

  const [activity, chart, lessons, openAssignments, overdue] = await Promise.all([
    recentActivity({ teacherId: teacher.id }, 12),
    dailyMinutes({ studentIds: ids }, 14),
    db.lesson.findMany({
      where: { teacherId: teacher.id, startsAt: { gte: dayStart, lt: dayEnd } },
      include: { students: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.assignment.count({ where: { teacherId: teacher.id, completedAt: null } }),
    db.assignment.groupBy({ by: ["studentId"], where: { teacherId: teacher.id, completedAt: null, dueAt: { lt: new Date() } }, _count: { _all: true } }),
  ]);

  const online = rows.filter((r) => r.online);
  const activeToday = rows.filter((r) => r.lastActiveAt && r.lastActiveAt >= dayStart).length;
  const weekSeconds = rows.reduce((n, r) => n + r.weekSeconds, 0);
  const overdueMap = new Map(overdue.map((o) => [o.studentId, o._count._all]));
  const attention = rows
    .filter((r) => r.active)
    .map((r) => {
      const days = r.lastActiveAt ? daysSince(r.lastActiveAt) : null;
      const reasons: string[] = [];
      if (days === null) reasons.push(t.teacher.neverLoggedIn);
      else if (days >= 3) reasons.push(fmt(t.teacher.inactiveDays, { n: days }));
      if (overdueMap.get(r.id)) reasons.push(fmt(t.teacher.overdueCount, { n: overdueMap.get(r.id)! }));
      return { r, reasons };
    })
    .filter((x) => x.reasons.length);

  const tiles = [
    { label: t.teacher.totalStudents, value: rows.length, icon: Users, cls: "bg-blue-soft text-blue-dark", href: "/teacher/students" },
    { label: t.teacher.onlineNow, value: online.length, icon: Wifi, cls: "bg-green-soft text-green-dark", href: "/teacher/students" },
    { label: t.teacher.weekMinutes, value: formatDuration(weekSeconds, locale), icon: Clock, cls: "bg-orange-soft text-orange-dark", href: "/teacher/students" },
    { label: t.teacher.openAssignments, value: openAssignments, icon: ClipboardList, cls: "bg-purple-soft text-purple-dark", href: "/teacher/assignments" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{fmt(t.teacher.welcome, { name: teacher.name })} 👋</h1>
        <Link href="/teacher/students" className="btn btn-green">
          <UserPlus size={18} /> {t.teacher.addFirst}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((s) => (
          <Link key={s.label} href={s.href} className="card flex items-center gap-4 border-b-4 transition-transform hover:-translate-y-0.5">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${s.cls}`}>
              <s.icon size={24} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-black tabular-nums">{s.value}</p>
              <p className="truncate text-xs font-extrabold tracking-wide text-muted uppercase">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="card">
            <h2 className="h2 mb-3">{t.teacher.dailyMinutes}</h2>
            <MinutesBars data={chart} />
          </section>
          <section className="card">
            <h2 className="h2 mb-2">{t.teacher.recentActivity}</h2>
            <ActivityFeed items={activity} t={t} locale={locale} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-black">
              <span className="size-3 animate-pulse rounded-full bg-green" /> {t.teacher.onlineNow}
            </h2>
            {online.length ? (
              <ul className="flex flex-col gap-2">
                {online.map((s) => (
                  <li key={s.id}>
                    <Link href={`/teacher/students/${s.id}`} className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-bg">
                      <Avatar name={s.name} online />
                      <span className="flex-1 font-bold">{s.name}</span>
                      <span className="chip bg-yellow-soft text-yellow-dark">{s.level}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-muted">{t.teacher.nobodyOnline}</p>
            )}
            <p className="text-xs font-bold text-muted">
              {t.teacher.activeToday}: {activeToday}/{rows.length}
            </p>
          </section>

          <section className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black">{t.teacher.todaysLessons}</h2>
              <Link href="/teacher/calendar" className="text-sm font-extrabold text-blue">{t.nav.calendar} →</Link>
            </div>
            {lessons.length ? (
              lessons.map((l) => (
                <div key={l.id} className="flex items-start gap-3 rounded-2xl bg-blue-soft p-3">
                  <CalendarDays className="mt-0.5 shrink-0 text-blue" size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{formatTime(l.startsAt, locale)} · {l.title}</p>
                    <p className="truncate text-sm font-semibold text-muted">{l.students.map((s) => s.name).join(", ")}</p>
                  </div>
                  {l.link && (
                    <a href={l.link} target="_blank" rel="noreferrer" className="text-blue" aria-label={t.calendar.join}>
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-muted">{t.teacher.noLessonsToday}</p>
            )}
          </section>

          <section className="card flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-black">
              <AlertTriangle size={18} className="text-orange" /> {t.teacher.needsAttention}
            </h2>
            {attention.length ? (
              <ul className="flex flex-col gap-2">
                {attention.map(({ r, reasons }) => (
                  <li key={r.id}>
                    <Link href={`/teacher/students/${r.id}`} className="flex items-center gap-3 rounded-2xl bg-orange-soft p-2.5">
                      <Avatar name={r.name} />
                      <span className="min-w-0">
                        <span className="block font-bold">{r.name}</span>
                        <span className="text-xs font-bold text-orange-dark">{reasons.join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-muted">{rows.length ? t.teacher.allGood : t.teacher.noStudents}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
