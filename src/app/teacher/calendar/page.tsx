import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { dayKey, formatTime, formatWeekday, TIME_ZONE, zoneDayStart } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { LessonForm } from "./lesson-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteLesson } from "@/app/actions/teacher";

// Haftanın pazartesisinden başlayan 7 gün (TIME_ZONE'a göre)
function weekDays(offset: number) {
  const todayKey = dayKey();
  const noon = new Date(`${todayKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" }).format(noon);
  const idx = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(noon);
    d.setUTCDate(d.getUTCDate() - idx + offset * 7 + i);
    return d.toISOString().slice(0, 10);
  });
}

export default async function CalendarPage({ searchParams }: PageProps<"/teacher/calendar">) {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const offset = Number((await searchParams).week ?? 0) || 0;
  const keys = weekDays(offset);
  const [lessons, students] = await Promise.all([
    db.lesson.findMany({
      where: { teacherId: teacher.id, startsAt: { gte: zoneDayStart(keys[0]), lt: zoneDayStart(keys[7]) } },
      include: { students: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.user.findMany({ where: { teacherId: teacher.id, active: true }, select: { id: true, name: true, level: true }, orderBy: { name: "asc" } }),
  ]);
  const today = dayKey();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="h1">📅 {t.calendar.title}</h1>
          <div className="flex items-center gap-2">
            <Link href={`?week=${offset - 1}`} className="btn btn-sm" aria-label={t.calendar.prevWeek}>
              <ChevronLeft size={16} />
            </Link>
            <Link href="?week=0" className={`btn btn-sm ${offset === 0 ? "btn-blue" : ""}`}>{t.calendar.thisWeek}</Link>
            <Link href={`?week=${offset + 1}`} className="btn btn-sm" aria-label={t.calendar.nextWeek}>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-7">
          {keys.slice(0, 7).map((k) => {
            const day = new Date(`${k}T12:00:00Z`);
            const items = lessons.filter((l) => dayKey(l.startsAt) === k);
            return (
              <div key={k} className={`flex min-h-40 flex-col gap-2 rounded-3xl border-2 p-2 ${k === today ? "border-blue bg-blue-soft" : "border-line bg-sheet"}`}>
                <p className={`px-1 text-xs font-black uppercase ${k === today ? "text-blue-dark" : "text-muted"}`}>{formatWeekday(day, locale)}</p>
                {items.map((l) => (
                  <div key={l.id} className="flex flex-col gap-1 rounded-2xl border-b-4 border-green-dark bg-green p-2 text-white">
                    <p className="text-xs font-black">
                      {formatTime(l.startsAt, locale)} · {fmt(t.common.minutes, { n: l.durationMin })}
                    </p>
                    <p className="text-sm leading-tight font-black">{l.title}</p>
                    <p className="text-xs font-bold opacity-90">{l.students.map((s) => s.name.split(" ")[0]).join(", ")}</p>
                    <div className="flex items-center justify-between">
                      {l.link ? (
                        <a href={l.link} target="_blank" rel="noreferrer" aria-label={t.calendar.join}>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span />
                      )}
                      <DeleteButton action={deleteLesson.bind(null, l.id)} confirm={t.common.confirmDelete} label={t.common.delete} light />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {!lessons.length && <p className="text-center font-semibold text-muted">{t.calendar.noLessons}</p>}

        {lessons.length > 0 && (
          <section className="card">
            <ul className="flex flex-col">
              {lessons.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 border-t-2 border-line py-3 first:border-t-0">
                  <span className="w-28 font-black">
                    {formatWeekday(l.startsAt, locale)} {formatTime(l.startsAt, locale)}
                  </span>
                  <span className="flex-1 font-bold">{l.title}</span>
                  <span className="flex -space-x-2">
                    {l.students.map((s) => (
                      <Avatar key={s.id} name={s.name} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <section className="card border-b-4 xl:sticky xl:top-8">
        <h2 className="h2 mb-4">{t.calendar.addLesson}</h2>
        <LessonForm students={students} t={t} />
      </section>
    </div>
  );
}
