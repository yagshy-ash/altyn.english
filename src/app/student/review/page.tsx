import Link from "next/link";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { getT } from "@/i18n/server";
import { ReviewSession } from "@/components/learn/review-session";

export default async function ReviewPage() {
  const student = await requireStudent();
  const { t } = await getT();
  // Önce hata kartları ve en çok unutulanlar; oturum başına en fazla 20 kart
  const cards = await db.vocabCard.findMany({
    where: { studentId: student.id, dueAt: { lte: new Date() } },
    orderBy: [{ box: "asc" }, { dueAt: "asc" }],
    take: 20,
    select: { id: true, word: true, translation: true, example: true, source: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h1">{t.nav.review}</h1>
      {cards.length ? (
        <ReviewSession cards={cards} t={t} />
      ) : (
        <div className="card mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
          <span className="text-6xl">✨</span>
          <p className="text-lg font-black">{t.vocab.noDue}</p>
          <Link href="/student/vocabulary" className="btn btn-green">{t.vocab.sets}</Link>
        </div>
      )}
    </div>
  );
}
