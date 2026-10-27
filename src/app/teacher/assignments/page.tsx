import Link from "next/link";
import { Eye } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { deleteAssignment } from "@/app/actions/teacher";
import { SkillIcon } from "@/components/skill-icon";
import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";

export default async function AssignmentsPage({ searchParams }: PageProps<"/teacher/assignments">) {
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const filter = (await searchParams).status as string | undefined;
  const now = new Date();
  const where =
    filter === "open"
      ? { completedAt: null }
      : filter === "overdue"
        ? { completedAt: null, dueAt: { lt: now } }
        : filter === "completed"
          ? { completedAt: { not: null } }
          : {};
  const items = await db.assignment.findMany({
    where: { teacherId: teacher.id, ...where },
    include: {
      student: { select: { id: true, name: true } },
      content: { select: { id: true, title: true, skill: true } },
      attempts: { select: { id: true, score: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ completedAt: { sort: "desc", nulls: "first" } }, { dueAt: { sort: "asc", nulls: "last" } }],
    take: 200,
  });

  const tabs = [
    { key: undefined, label: t.common.all },
    { key: "open", label: t.assignments.open },
    { key: "overdue", label: t.assignments.overdue },
    { key: "completed", label: t.assignments.completed },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="h1">📌 {t.assignments.title}</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link key={tab.label} href={tab.key ? `?status=${tab.key}` : "?"} className={`btn btn-sm ${filter === tab.key ? "btn-blue" : ""}`}>
            {tab.label}
          </Link>
        ))}
      </div>
      {items.length ? (
        <ul className="card flex flex-col p-2">
          {items.map((a) => {
            const overdue = !a.completedAt && a.dueAt && a.dueAt < now;
            const attempt = a.attempts[0];
            const score = attempt?.score;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 border-t-2 border-line p-3 first:border-t-0">
                <SkillIcon skill={a.content.skill} size="sm" />
                <Link href={`/teacher/content/${a.content.id}`} className="min-w-0 flex-1 font-black hover:underline">
                  {a.content.title}
                  {a.note && <span className="block text-xs font-semibold text-muted">{a.note}</span>}
                </Link>
                <Link href={`/teacher/students/${a.student.id}`} className="flex items-center gap-2 font-bold">
                  <Avatar name={a.student.name} /> {a.student.name}
                </Link>
                <span className="w-28 text-sm font-bold text-muted">{a.dueAt ? formatDate(a.dueAt, locale) : "—"}</span>
                <span className={`chip ${a.completedAt ? "bg-green-soft text-green-dark" : overdue ? "bg-red-soft text-red-dark" : "bg-yellow-soft text-yellow-dark"}`}>
                  {a.completedAt ? `${t.assignments.completed}${score != null ? ` · ${Math.round(score)}%` : ""}` : overdue ? t.assignments.overdue : t.assignments.open}
                </span>
                {attempt && (
                  <Link href={`/teacher/students/${a.student.id}/attempts/${attempt.id}`} className="btn btn-sm btn-blue">
                    <Eye size={16} /> {t.assignments.viewResult}
                  </Link>
                )}
                <DeleteButton action={deleteAssignment.bind(null, a.id)} confirm={t.common.confirmDelete} label={t.common.delete} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card font-semibold text-muted">{t.assignments.empty}</p>
      )}
    </div>
  );
}
