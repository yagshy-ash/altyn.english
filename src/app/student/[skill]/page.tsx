import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, RotateCcw, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { visibleContentWhere } from "@/lib/content";
import { bestScores, studentStats } from "@/lib/student-data";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n";
import { isSkillSlug, SKILL_SLUGS } from "@/lib/skills";
import { SKILL_STYLE, SkillIcon } from "@/components/skill-icon";
import { ExplainBox } from "@/components/learn/explain-box";
import type { VocabularyBody } from "@/lib/content-schemas";

export default async function SkillPage({ params, searchParams }: PageProps<"/student/[skill]">) {
  const { skill: slug } = await params;
  const { tab } = await searchParams;
  if (!isSkillSlug(slug)) notFound();
  const skill = SKILL_SLUGS[slug];
  const student = await requireStudent();
  const { t } = await getT();

  const [contents, best, assigned, stats, deckCount] = await Promise.all([
    db.content.findMany({ where: visibleContentWhere(student.level, skill), orderBy: [{ createdAt: "asc" }] }),
    bestScores(student.id),
    db.assignment.findMany({ where: { studentId: student.id, completedAt: null }, select: { contentId: true } }),
    studentStats(student.id),
    skill === "VOCABULARY" ? db.vocabCard.count({ where: { studentId: student.id } }) : Promise.resolve(0),
  ]);
  const assignedIds = new Set(assigned.map((a) => a.contentId));
  // Kelime setleri: destede olan kelimeler (set "eklendi" mi?)
  const deckWords =
    skill === "VOCABULARY"
      ? new Set((await db.vocabCard.findMany({ where: { studentId: student.id }, select: { word: true } })).map((c) => c.word))
      : new Set<string>();
  const showExplain = skill === "READING" && tab === "explain";

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex items-center gap-4 rounded-3xl border-b-4 p-6 text-white ${SKILL_STYLE[skill].solid}`}>
        <span className="grid size-16 place-items-center rounded-3xl bg-white/20">
          <SkillIcon skill={skill} size="md" />
        </span>
        <div>
          <h1 className="h1">{t.skills[skill].name}</h1>
          <p className="font-bold opacity-90">{t.skills[skill].desc}</p>
        </div>
        <span className="ml-auto hidden rounded-2xl bg-white/20 px-4 py-2 font-black sm:block">{t.levels[student.level]}</span>
      </div>

      {skill === "VOCABULARY" && (
        <Link href="/student/review" className="card flex items-center gap-4 border-b-4 border-purple bg-purple-soft">
          <span className="grid size-12 place-items-center rounded-2xl border-b-4 border-purple-dark bg-purple text-white">
            <RotateCcw size={24} strokeWidth={2.6} />
          </span>
          <div className="flex-1">
            <p className="font-black text-purple-dark">{t.vocab.deck}</p>
            <p className="text-sm font-bold text-muted">
              {fmt(t.vocab.inDeck, { n: deckCount })} · {stats.due > 0 ? fmt(t.vocab.dueNow, { n: stats.due }) : t.vocab.noDue}
            </p>
          </div>
          {stats.due > 0 && <span className="btn btn-sm border-purple border-b-purple-dark bg-purple text-white">{t.student.reviewNow}</span>}
        </Link>
      )}

      {skill === "READING" && (
        <div className="flex gap-2">
          <Link href="/student/reading" className={`btn btn-sm ${!showExplain ? "btn-blue" : ""}`}>{t.explain.library}</Link>
          <Link href="/student/reading?tab=explain" className={`btn btn-sm ${showExplain ? "btn-blue" : ""}`}>{t.explain.tab}</Link>
        </div>
      )}

      {showExplain ? (
        <ExplainBox t={{ ...t.explain, error: t.common.error }} />
      ) : contents.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((c, i) => {
            const score = best.get(c.id);
            const words = skill === "VOCABULARY" ? (c.body as VocabularyBody).words : null;
            const added = words ? words.every((w) => deckWords.has(w.word)) : false;
            const done = score !== undefined || added;
            return (
              <li key={c.id}>
                <Link
                  href={`/student/${slug}/${c.id}`}
                  className={`card flex h-full flex-col gap-3 border-b-4 transition-transform hover:-translate-y-0.5 ${done ? "border-green" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`grid size-10 place-items-center rounded-2xl text-lg font-black ${done ? "bg-green text-white" : `${SKILL_STYLE[skill].soft} ${SKILL_STYLE[skill].text}`}`}>
                      {done ? <Check size={22} strokeWidth={3.5} /> : i + 1}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1">
                      {assignedIds.has(c.id) && <span className="chip bg-red-soft text-red-dark">{t.student.assigned}</span>}
                      {score !== undefined && (
                        <span className="chip bg-yellow-soft text-yellow-dark">
                          <Star size={12} fill="currentColor" /> {Math.round(score)}%
                        </span>
                      )}
                      {added && <span className="chip bg-green-soft text-green-dark">{t.vocab.added}</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black">{c.title}</h3>
                    <p className="text-sm font-semibold text-muted">
                      {words ? fmt(t.vocab.words, { n: words.length }) : c.topic}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card font-semibold text-muted">{t.student.emptySkill}</p>
      )}
    </div>
  );
}
