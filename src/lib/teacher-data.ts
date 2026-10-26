import "server-only";
import { db } from "@/lib/db";
import { daysAgo } from "@/lib/format";
import { isOnline, secondsSince, streakFor } from "@/lib/stats";

// Öğrenci listesi + her öğrencinin özet metrikleri
export async function studentRows(teacherId: string) {
  const students = await db.user.findMany({
    where: { teacherId },
    orderBy: [{ active: "desc" }, { lastActiveAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  });
  const ids = students.map((s) => s.id);
  const [week, scores, streaks] = await Promise.all([
    secondsSince(ids, daysAgo(6)),
    db.attempt.groupBy({ by: ["studentId"], where: { studentId: { in: ids } }, _avg: { score: true }, _count: { _all: true } }),
    Promise.all(ids.map((id) => streakFor(id))),
  ]);
  const scoreMap = new Map(scores.map((s) => [s.studentId, s]));
  return students.map((s, i) => ({
    ...s,
    online: isOnline(s.lastActiveAt),
    weekSeconds: week[s.id] ?? 0,
    avgScore: scoreMap.get(s.id)?._avg.score ?? null,
    attempts: scoreMap.get(s.id)?._count._all ?? 0,
    streak: streaks[i],
  }));
}

export type StudentRow = Awaited<ReturnType<typeof studentRows>>[number];

export async function recentActivity(where: { teacherId?: string; studentId?: string }, take = 15) {
  return db.attempt.findMany({
    where: where.studentId ? { studentId: where.studentId } : { student: { teacherId: where.teacherId } },
    include: { student: { select: { id: true, name: true } }, content: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
