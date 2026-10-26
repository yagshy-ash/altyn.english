import { CalendarDays, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatTime, formatWeekday } from "@/lib/format";

export default async function LessonsPage() {
  const student = await requireStudent();
  const { locale, t } = await getT();
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.lesson.findMany({ where: { students: { some: { id: student.id } }, startsAt: { gte: new Date(now.getTime() - 3600_000) } }, orderBy: { startsAt: "asc" } }),
    db.lesson.findMany({ where: { students: { some: { id: student.id } }, startsAt: { lt: new Date(now.getTime() - 3600_000) } }, orderBy: { startsAt: "desc" }, take: 10 }),
  ]);

  const Item = ({ l, dim }: { l: (typeof upcoming)[number]; dim?: boolean }) => (
    <li className={`card flex items-center gap-4 ${dim ? "opacity-60" : "border-b-4"}`}>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-soft text-blue">
        <CalendarDays size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-black">{l.title}</p>
        <p className="font-bold text-muted">
          {formatWeekday(l.startsAt, locale, "long")} · {formatTime(l.startsAt, locale)} · {fmt(t.common.minutes, { n: l.durationMin })}
        </p>
        {l.note && <p className="mt-1 text-sm font-semibold">{l.note}</p>}
      </div>
      {l.link && !dim && (
        <a href={l.link} target="_blank" rel="noreferrer" className="btn btn-blue">
          <ExternalLink size={16} /> {t.calendar.join}
        </a>
      )}
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">📅 {t.student.lessonsTitle}</h1>
      {upcoming.length ? (
        <ul className="flex flex-col gap-3">{upcoming.map((l) => <Item key={l.id} l={l} />)}</ul>
      ) : (
        <p className="card font-semibold text-muted">{t.student.noUpcoming}</p>
      )}
      {past.length > 0 && (
        <>
          <h2 className="h2">{t.student.past}</h2>
          <ul className="flex flex-col gap-3">{past.map((l) => <Item key={l.id} l={l} dim />)}</ul>
        </>
      )}
    </div>
  );
}
