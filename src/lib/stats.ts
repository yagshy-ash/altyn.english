import "server-only";
import { db } from "@/lib/db";
import { dayDate, dayKey, daysAgo } from "@/lib/format";

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function isOnline(lastActiveAt: Date | null) {
  return !!lastActiveAt && Date.now() - lastActiveAt.getTime() < ONLINE_WINDOW_MS;
}

// Her deneme 10 XP + puanın onda biri
export async function xpFor(studentId: string) {
  const agg = await db.attempt.aggregate({ where: { studentId }, _count: { _all: true }, _sum: { score: true } });
  return agg._count._all * 10 + Math.round((agg._sum.score ?? 0) / 10);
}

// Bugünden (ya da henüz bugün çalışmadıysa dünden) geriye kesintisiz çalışılan gün sayısı
export async function streakFor(studentId: string) {
  const rows = await db.activityDay.groupBy({
    by: ["day"],
    where: { studentId, day: { gte: daysAgo(365) } },
    orderBy: { day: "desc" },
  });
  const days = new Set(rows.map((r) => r.day.toISOString().slice(0, 10)));
  const cursor = dayDate(dayKey());
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function secondsSince(studentIds: string[], since: Date) {
  const rows = await db.activityDay.groupBy({
    by: ["studentId"],
    where: { studentId: { in: studentIds }, day: { gte: since } },
    _sum: { seconds: true },
  });
  return Object.fromEntries(rows.map((r) => [r.studentId, r._sum.seconds ?? 0])) as Record<string, number>;
}

// Son n günün günlük dakikaları (grafik için, eksik günler 0)
export async function dailyMinutes(where: { studentId?: string; studentIds?: string[] }, n: number) {
  const since = daysAgo(n - 1);
  const rows = await db.activityDay.groupBy({
    by: ["day"],
    where: {
      day: { gte: since },
      ...(where.studentId ? { studentId: where.studentId } : { studentId: { in: where.studentIds ?? [] } }),
    },
    _sum: { seconds: true },
  });
  const map = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r._sum.seconds ?? 0]));
  return Array.from({ length: n }, (_, i) => {
    const d = daysAgo(n - 1 - i);
    const key = d.toISOString().slice(0, 10);
    return { day: key.slice(5), minutes: Math.round((map.get(key) ?? 0) / 60) };
  });
}

export function daysSince(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / 86400_000);
}
