import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { SkillIcon } from "@/components/skill-icon";
import { ContentBody } from "@/components/learn/content-body";
import { AssignForm } from "./assign-form";
import { ContentActions } from "./content-actions";

export default async function ContentDetail({ params }: PageProps<"/teacher/content/[id]">) {
  const { id } = await params;
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const content = await db.content.findUnique({ where: { id } });
  if (!content) notFound();
  const students = await db.user.findMany({ where: { teacherId: teacher.id, active: true }, select: { id: true, name: true, level: true }, orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <Link href={`/teacher/content?level=${content.level}&skill=${content.skill}`} className="flex w-fit items-center gap-1 font-extrabold text-muted hover:text-ink">
          <ArrowLeft size={18} /> {t.content.title}
        </Link>
        <div className="flex items-center gap-4">
          <SkillIcon skill={content.skill} size="lg" />
          <div>
            <h1 className="h1">{content.title}</h1>
            <p className="font-bold text-muted">
              {t.levels[content.level]} · {t.skills[content.skill].name} · {content.topic}
            </p>
          </div>
        </div>
        <ContentBody content={{ id: content.id, skill: content.skill, body: content.body }} locale={locale} t={t} preview />
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-8">
        <section className="card border-b-4">
          <h2 className="h2 mb-4">📌 {t.content.assign}</h2>
          <AssignForm contentId={content.id} students={students.filter((s) => s.level === content.level).concat(students.filter((s) => s.level !== content.level))} t={t} />
        </section>
        <section className="card">
          <ContentActions id={content.id} published={content.published} t={t} />
        </section>
      </aside>
    </div>
  );
}
