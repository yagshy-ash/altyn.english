import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import { dayDate, dayKey } from "@/lib/format";

// Öğrenci sayfası açık ve sekme görünürken her 30 saniyede bir çağrılır.
// Günlük süreyi (bölüm bazında), online oturumu ve "son görülme"yi günceller.
const BEAT = 30;
const GAP_MS = 2 * 60 * 1000;
const AREAS = new Set(["home", "vocabulary", "reading", "listening", "grammar", "writing", "speaking", "chat", "review", "lessons", "watch"]);

export async function POST(req: Request) {
  const session = await readSession();
  if (!session || session.role !== "STUDENT") return new Response(null, { status: 204 });
  // Kapatılmış ya da silinmiş hesap süre yazmaz
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { active: true } });
  if (!user?.active) return new Response(null, { status: 204 });

  const { area } = (await req.json().catch(() => ({}))) as { area?: string };
  const safeArea = area && AREAS.has(area) ? area : "home";
  const studentId = session.userId;
  const now = new Date();
  const day = dayDate(dayKey(now));

  const last = await db.onlineSession.findFirst({ where: { studentId }, orderBy: { lastSeenAt: "desc" } });
  await Promise.all([
    db.activityDay.upsert({
      where: { studentId_day_area: { studentId, day, area: safeArea } },
      create: { studentId, day, area: safeArea, seconds: BEAT },
      update: { seconds: { increment: BEAT } },
    }),
    last && now.getTime() - last.lastSeenAt.getTime() < GAP_MS
      ? db.onlineSession.update({ where: { id: last.id }, data: { lastSeenAt: now, seconds: { increment: BEAT } } })
      : db.onlineSession.create({ data: { studentId, startedAt: now, lastSeenAt: now, seconds: BEAT } }),
    db.user.update({ where: { id: studentId }, data: { lastActiveAt: now } }),
  ]);
  return new Response(null, { status: 204 });
}
