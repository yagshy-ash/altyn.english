import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type RankRow = { id: string; username: string; xp: number; rank: number };

// Seviyeden bağımsız sıralama: öğretmenin aktif öğrencileri, toplam XP'ye göre (XP: stats.ts xpFor ile aynı formül).
// Kimse elle değiştiremez; yalnızca yapılan çalışmalardan hesaplanır. Eşit XP aynı sırayı paylaşır.
export const leaderboard = cache(async (teacherId: string): Promise<RankRow[]> => {
  const students = await db.user.findMany({
    where: { teacherId, role: "STUDENT", active: true },
    select: { id: true, username: true },
  });
  const agg = await db.attempt.groupBy({
    by: ["studentId"],
    where: { studentId: { in: students.map((s) => s.id) } },
    _count: { _all: true },
    _sum: { score: true },
  });
  const xp = new Map(agg.map((a) => [a.studentId, a._count._all * 10 + Math.round((a._sum.score ?? 0) / 10)]));
  const sorted = students
    .map((s) => ({ ...s, xp: xp.get(s.id) ?? 0 }))
    .sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username));
  let rank = 0;
  return sorted.map((s, i) => {
    if (i === 0 || s.xp !== sorted[i - 1].xp) rank = i + 1;
    return { ...s, rank };
  });
});
