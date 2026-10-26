import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { visibleContentWhere } from "@/lib/content";
import { dayKey, daysAgo, zoneDayStart } from "@/lib/format";
import { streakFor, xpFor } from "@/lib/stats";
import type { Level, Skill } from "@/generated/prisma/enums";

export const DAILY_GOAL_MIN = 15;

export const studentStats = cache(async (studentId: string) => {
  const [streak, xp, due, todaySec] = await Promise.all([
    streakFor(studentId),
    xpFor(studentId),
    db.vocabCard.count({ where: { studentId, dueAt: { lte: new Date() } } }),
    db.activityDay.aggregate({ where: { studentId, day: daysAgo(0) }, _sum: { seconds: true } }),
  ]);
  return { streak, xp, due, todayMin: Math.round((todaySec._sum.seconds ?? 0) / 60) };
});

// İçerik başına en iyi puan (tamamlandı rozetleri ve ilerleme için)
export async function bestScores(studentId: string) {
  const rows = await db.attempt.groupBy({
    by: ["contentId"],
    where: { studentId, contentId: { not: null } },
    _max: { score: true },
  });
  return new Map(rows.map((r) => [r.contentId!, r._max.score ?? 0]));
}

export async function skillProgress(studentId: string, level: Level) {
  const [contents, best] = await Promise.all([
    db.content.findMany({ where: visibleContentWhere(level), select: { id: true, skill: true } }),
    bestScores(studentId),
  ]);
  const out: Partial<Record<Skill, { total: number; done: number }>> = {};
  for (const c of contents) {
    const p = (out[c.skill] ??= { total: 0, done: 0 });
    p.total++;
    if (best.has(c.id)) p.done++;
  }
  return out;
}

// Bugünün seti: bugünkü denemelerden otomatik işaretlenir
export async function todaySet(studentId: string) {
  const attempts = await db.attempt.findMany({
    where: { studentId, createdAt: { gte: zoneDayStart() } },
    select: { skill: true, answers: true },
  });
  const has = (s: Skill) => attempts.some((a) => a.skill === s);
  const reviewed = attempts
    .filter((a) => a.skill === "VOCABULARY")
    .reduce((n, a) => n + ((a.answers as { reviewed?: number } | null)?.reviewed ?? 0), 0);
  return {
    cards: { done: reviewed >= 20, value: Math.min(reviewed, 20) },
    reading: has("READING"),
    listening: has("LISTENING"),
    grammar: has("GRAMMAR"),
    produce: has("WRITING") || has("SPEAKING"),
  };
}

// Son 7 günün çalışma dakikaları (seri noktaları)
export async function weekDots(studentId: string) {
  const since = daysAgo(6);
  const rows = await db.activityDay.groupBy({ by: ["day"], where: { studentId, day: { gte: since } }, _sum: { seconds: true } });
  const map = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r._sum.seconds ?? 0]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    const key = d.toISOString().slice(0, 10);
    return { date: d, minutes: Math.round((map.get(key) ?? 0) / 60), today: key === dayKey() };
  });
}

export async function topMistakes(studentId: string, take = 3) {
  const rows = await db.mistake.groupBy({
    by: ["type"],
    where: { studentId },
    _count: { _all: true },
    orderBy: { _count: { type: "desc" } },
    take,
  });
  return rows.map((r) => ({ type: r.type, count: r._count._all }));
}

export async function aiLevelHistory(studentId: string) {
  return db.levelSnapshot.findMany({ where: { studentId }, orderBy: { createdAt: "asc" }, take: 60 });
}

export async function feedFor(student: { id: string; level: Level; teacherId: string | null }) {
  if (!student.teacherId) return [];
  return db.post.findMany({
    where: {
      teacherId: student.teacherId,
      AND: [{ OR: [{ level: null }, { level: student.level }] }, { OR: [{ studentId: null }, { studentId: student.id }] }],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 10,
  });
}

export async function upcomingLessons(studentId: string, take = 5) {
  return db.lesson.findMany({
    where: { students: { some: { id: studentId } }, startsAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { startsAt: "asc" },
    take,
  });
}
