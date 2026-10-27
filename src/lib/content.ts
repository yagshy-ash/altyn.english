import "server-only";
import { db } from "@/lib/db";
import type { Level, Skill } from "@/generated/prisma/enums";

// Öğrencinin göreceği içeriğin tek kuralı: öğretmenin atadığı seviyeye (A1…C2 veya TOEFL)
// etiketlenmiş, yayında olan içerik. Bütün öğrenci sayfaları içeriği bu filtreyle çeker.
export function visibleContentWhere(level: Level, skill?: Skill) {
  return { level, published: true, ...(skill ? { skill } : {}) };
}

// Tek bir içeriği açarken: seviyesindeki içerik + öğretmenin bu öğrenciye özellikle atadığı içerik
// (öğretmen başka seviyeden de ödev verebilir)
export function openableContentWhere(student: { id: string; level: Level }, skill?: Skill) {
  return {
    ...(skill ? { skill } : {}),
    OR: [visibleContentWhere(student.level), { assignments: { some: { studentId: student.id } } }],
  };
}

export async function contentCountsBySkill(level: Level) {
  const rows = await db.content.groupBy({
    by: ["skill"],
    where: visibleContentWhere(level),
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.skill, r._count._all])) as Partial<Record<Skill, number>>;
}
