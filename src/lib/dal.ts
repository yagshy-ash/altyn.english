import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/enums";

// Data Access Layer: her sayfa ve server action yetkiyi buradan doğrular.
// proxy.ts sadece hızlı yönlendirme yapar, asıl kontrol burası.

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, role: true, locale: true, level: true, active: true, teacherId: true },
  });
  if (!user || !user.active) return null;
  return user;
});

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  // Çerez var ama hesap kapatılmış/silinmiş: çerezi silmeden /login'e gitmek proxy ile döngü yapar
  if (!user) redirect((await readSession()) ? "/api/session/end" : "/login");
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}

export const requireTeacher = () => requireUser("TEACHER");
export const requireStudent = () => requireUser("STUDENT");

export function homeFor(role: Role) {
  return role === "TEACHER" ? "/teacher" : "/student";
}
