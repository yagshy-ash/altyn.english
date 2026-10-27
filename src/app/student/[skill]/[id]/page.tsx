import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { openableContentWhere } from "@/lib/content";
import { getT } from "@/i18n/server";
import { isSkillSlug, SKILL_SLUGS } from "@/lib/skills";
import { formatDate } from "@/lib/format";
import { SkillIcon } from "@/components/skill-icon";
import { ContentBody } from "@/components/learn/content-body";
import { FeedbackView } from "@/components/learn/feedback-view";
import type { Feedback, VocabularyBody } from "@/lib/content-schemas";

export default async function ContentPage({ params }: PageProps<"/student/[skill]/[id]">) {
  const { skill: slug, id } = await params;
  if (!isSkillSlug(slug)) notFound();
  const student = await requireStudent();
  const { locale, t } = await getT();
  const content = await db.content.findFirst({ where: { id, ...openableContentWhere(student, SKILL_SLUGS[slug]) } });
  if (!content) notFound();

  let added = false;
  if (content.skill === "VOCABULARY") {
    const words = (content.body as VocabularyBody).words.map((w) => w.word);
    added = (await db.vocabCard.count({ where: { studentId: student.id, word: { in: words } } })) === words.length;
  }
  // Yazma/konuşma: önceki denemeler ve geri bildirimleri
  const history =
    content.skill === "WRITING" || content.skill === "SPEAKING"
      ? await db.attempt.findMany({ where: { studentId: student.id, contentId: content.id }, orderBy: { createdAt: "desc" }, take: 5 })
      : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href={`/student/${slug}`} className="flex w-fit items-center gap-1 font-extrabold text-muted hover:text-ink">
        <ArrowLeft size={18} /> {t.skills[content.skill].name}
      </Link>
      <div className="flex items-center gap-4">
        <SkillIcon skill={content.skill} size="lg" />
        <div>
          <h1 className="h1">{content.title}</h1>
          <p className="font-bold text-muted">{content.topic}</p>
        </div>
      </div>

      <ContentBody content={{ id: content.id, skill: content.skill, body: content.body }} locale={locale} t={t} added={added} />

      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="h2">{t.writing.history}</h2>
          {history.map((a) => (
            <details key={a.id} className="card">
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-extrabold">
                <span>{formatDate(a.createdAt, locale, true)}</span>
                <span className="chip bg-yellow-soft text-yellow-dark">{Math.round(a.score ?? 0)}%</span>
              </summary>
              <p className="my-3 rounded-2xl bg-bg p-3 font-read whitespace-pre-wrap">{(a.answers as { text?: string } | null)?.text}</p>
              {a.feedback && <FeedbackView f={a.feedback as Feedback} t={t} />}
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
