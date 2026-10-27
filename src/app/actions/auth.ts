"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { getCurrentUser, homeFor } from "@/lib/dal";
import { isLocale, LOCALE_COOKIE } from "@/i18n";

const YEAR = 60 * 60 * 24 * 365;

export type LoginState = { error?: boolean; closed?: boolean; username?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = username ? await db.user.findUnique({ where: { username } }) : null;
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return { error: true, username };
  // Şifre doğru ama hesap kapatılmış: bunu söylemek güvenli (şifreyi bilen zaten hesabın sahibi)
  if (!user.active) return { closed: true, username };

  await createSession({ userId: user.id, role: user.role });
  (await cookies()).set(LOCALE_COOKIE, user.locale, { path: "/", maxAge: YEAR });
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  redirect(homeFor(user.role));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale } });
  revalidatePath("/", "layout");
}
