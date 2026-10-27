"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { Level, Locale } from "@/generated/prisma/enums";

const StudentSchema = z.object({
  name: z.string().trim().min(2, { error: "nameRule" }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{3,32}$/, { error: "usernameRule" }),
  password: z.string().min(6, { error: "passwordRule" }),
  locale: z.enum(Locale),
  level: z.enum(Level),
  note: z.string().trim().max(500).optional(),
});

// Hata değerleri sözlük anahtarlarıdır (t.students[key]); çeviriyi form yapar.
type ErrorKey = "nameRule" | "usernameRule" | "passwordRule" | "usernameTaken";

export type CreateStudentState =
  | { ok: false; errors: Partial<Record<"name" | "username" | "password", ErrorKey>> }
  | { ok: true; username: string; password: string; name: string }
  | undefined;

export async function createStudent(_prev: CreateStudentState, formData: FormData): Promise<CreateStudentState> {
  const teacher = await requireTeacher();

  const parsed = StudentSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    level: formData.get("level"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    const errors: Partial<Record<"name" | "username" | "password", ErrorKey>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as "name" | "username" | "password";
      errors[field] ??= issue.message as ErrorKey;
    }
    return { ok: false, errors };
  }

  const { password, ...data } = parsed.data;
  const exists = await db.user.findUnique({ where: { username: data.username }, select: { id: true } });
  if (exists) return { ok: false, errors: { username: "usernameTaken" } };

  await db.user.create({
    data: {
      ...data,
      role: "STUDENT",
      teacherId: teacher.id,
      passwordHash: await bcrypt.hash(password, 10),
      levelHistory: { create: { level: data.level, source: "teacher" } },
    },
  });

  revalidatePath("/teacher", "layout");
  return { ok: true, username: data.username, password, name: data.name };
}

async function ownStudent(studentId: string) {
  const teacher = await requireTeacher();
  const student = await db.user.findFirst({ where: { id: studentId, teacherId: teacher.id } });
  if (!student) throw new Error("Student not found");
  return student;
}

export async function toggleStudentActive(studentId: string) {
  const student = await ownStudent(studentId);
  await db.user.update({ where: { id: student.id }, data: { active: !student.active } });
  revalidatePath("/teacher", "layout");
}

// Kalıcı silme: denemeler, hatalar, kartlar, süreler, ödevler ve kişisel paylaşımlar da silinir (onDelete: Cascade).
// Öğrencinin açık oturumu bir sonraki istekte kapanır (dal.ts).
export async function deleteStudent(studentId: string) {
  const student = await ownStudent(studentId);
  await db.user.delete({ where: { id: student.id } });
  revalidatePath("/teacher", "layout");
  redirect("/teacher/students");
}

export async function resetStudentPassword(studentId: string) {
  const student = await ownStudent(studentId);
  const password = generatePassword();
  await db.user.update({ where: { id: student.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return password;
}

export async function updateStudentLevel(studentId: string, level: string) {
  const student = await ownStudent(studentId);
  const parsed = z.enum(Level).parse(level);
  await db.user.update({
    where: { id: student.id },
    data: { level: parsed, levelHistory: { create: { level: parsed, source: "teacher" } } },
  });
  revalidatePath("/teacher", "layout");
}

// Okunması kolay şifre: karışan harfler (l, 1, o, 0) yok
function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
