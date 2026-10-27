import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { formatDate, formatDuration } from "@/lib/format";
import { FeedbackView } from "@/components/learn/feedback-view";
import type { Feedback } from "@/lib/content-schemas";

// Bir çalışmanın ayrıntısı: yazma/konuşma/sohbet cevabı ve YZ değerlendirmesi, quizlerde yanlış cevaplar
export default async function AttemptPage({ params }: PageProps<"/teacher/students/[id]/attempts/[attemptId]">) {
  const { id, attemptId } = await params;
  const teacher = await requireTeacher();
  const { locale, t } = await getT();
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, studentId: id, student: { teacherId: teacher.id } },
    include: { student: { select: { name: true } }, content: { select: { title: true } }, mistakes: { orderBy: { createdAt: "asc" } } },
  });
  if (!attempt) notFound();
  const answers = attempt.answers as { text?: string; history?: { role: string; text: string }[] } | null;
  const written = Boolean(answers?.text || answers?.history?.length);
  const score = Math.round(attempt.score ?? 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href={`/teacher/students/${id}`} className="flex w-fit items-center gap-1 font-extrabold text-muted hover:text-ink">
        <ArrowLeft size={18} /> {attempt.student.name}
      </Link>
      <h1 className="h1">{attempt.content?.title ?? t.nav.chat}</h1>
      <p className="font-bold text-muted">
        {t.skills[attempt.skill].name} · {formatDate(attempt.createdAt, locale, true)} · {formatDuration(attempt.durationSec, locale)}{" "}
        <span className={`chip ml-1 ${score >= 80 ? "bg-green-soft text-green-dark" : score >= 50 ? "bg-yellow-soft text-yellow-dark" : "bg-red-soft text-red-dark"}`}>
          {score}%
        </span>
      </p>

      {written && (
        <section className="card flex flex-col gap-2">
          <h2 className="eyebrow">{t.students.answer}</h2>
          {answers?.text && <p className="font-read text-lg whitespace-pre-wrap">{answers.text}</p>}
          {answers?.history?.map((m, i) => (
            <p key={i} className={`rounded-2xl px-3 py-2 font-semibold ${m.role === "student" ? "self-end bg-blue text-white" : "self-start bg-bg"}`}>
              {m.text}
            </p>
          ))}
        </section>
      )}

      {!attempt.feedback && (
        <section className="card flex flex-col gap-3">
          <h2 className="eyebrow">{t.students.wrongAnswers}</h2>
          {attempt.mistakes.length ? (
            attempt.mistakes.map((m) => (
              <div key={m.id} className="flex flex-col gap-1 border-t-2 border-line pt-3 first:border-t-0 first:pt-0">
                {m.explanation && <p className="font-semibold">{m.explanation}</p>}
                <p className="font-bold">
                  <span className="text-red-dark line-through">{m.wrong}</span> → <span className="text-green-dark">{m.right}</span>
                </p>
              </div>
            ))
          ) : (
            <p className="font-bold text-green-dark">{t.students.allCorrect}</p>
          )}
        </section>
      )}

      {attempt.feedback && <FeedbackView f={attempt.feedback as Feedback} t={t} />}
    </div>
  );
}
