"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/dal";
import { generateContent, isAiUnavailable, quizForText } from "@/lib/ai";
import { MAX_TEXT_CHARS, missingPart } from "@/lib/content-schemas";
import { GRAMMAR, pick, TOPICS, VOCAB_THEMES } from "@/lib/syllabus";
import { MAX_VIDEOS_PER_LEVEL, youtubeId } from "@/lib/youtube";
import { Level, Skill } from "@/generated/prisma/enums";

type FormState = { ok?: boolean; at?: number; error?: string } | undefined;

async function ownStudentIds(teacherId: string, ids: string[]) {
  const rows = await db.user.findMany({ where: { id: { in: ids }, teacherId }, select: { id: true } });
  return rows.map((r) => r.id);
}

/* ---------- İçerik ---------- */

export async function generate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireTeacher();
  const skill = z.enum(Skill).parse(formData.get("skill"));
  const level = z.enum(Level).parse(formData.get("level"));
  const given = String(formData.get("topic") ?? "").trim();
  const topic =
    given || pick(skill === "GRAMMAR" ? GRAMMAR[level] : skill === "VOCABULARY" ? VOCAB_THEMES[level] : TOPICS[level]);
  let id: string;
  try {
    const out = await generateContent({ skill, level, topic });
    const created = await db.content.create({
      data: { skill, level, topic: out.topic, title: out.title, body: out.body as object },
    });
    id = created.id;
  } catch (e) {
    console.error(e);
    return { error: isAiUnavailable(e) ? "ai" : "error" };
  }
  revalidatePath("/teacher/content");
  redirect(`/teacher/content/${id}`);
}

// Öğretmenin kendi metni: metin aynen saklanır, YZ yalnızca kelime listesi ve sorular üretir

export async function createFromText(_prev: FormState, formData: FormData): Promise<FormState> {
  const teacher = await requireTeacher();
  const skill = z.enum(["READING", "LISTENING"]).parse(formData.get("skill"));
  const level = z.enum(Level).parse(formData.get("level"));
  const count = z.coerce.number().int().min(3).max(10).parse(formData.get("count"));
  const givenTitle = String(formData.get("title") ?? "").trim().slice(0, 200);
  const text = String(formData.get("text") ?? "").replace(/\r\n?/g, "\n").trim();
  if (text.split(/\s+/).length < 30) return { error: "tooShort" };
  if (text.length > MAX_TEXT_CHARS) return { error: "tooLong" };
  // Boş satırlar paragrafları ayırır; hiç boş satır yoksa her satır ayrı paragraf (diyaloglar için)
  const blocks = /\n\s*\n/.test(text) ? text.split(/\n\s*\n/) : text.split("\n");
  const parts = blocks.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  let id: string;
  try {
    const quiz = await quizForText({ text: parts.join("\n\n"), level, skill, count });
    const body = { [skill === "READING" ? "passage" : "script"]: parts, glossary: quiz.glossary, questions: quiz.questions };
    const missing = missingPart(skill, body);
    if (missing) throw new Error(`Text quiz incomplete (no ${missing})`);
    const created = await db.content.create({
      data: { skill, level, topic: quiz.topic, title: givenTitle || quiz.title, body, aiGenerated: false, createdById: teacher.id },
    });
    id = created.id;
  } catch (e) {
    console.error(e);
    return { error: isAiUnavailable(e) ? "ai" : "error" };
  }
  revalidatePath("/teacher/content");
  redirect(`/teacher/content/${id}`);
}

export async function setPublished(contentId: string, published: boolean) {
  await requireTeacher();
  await db.content.update({ where: { id: contentId }, data: { published } });
  revalidatePath("/teacher/content", "layout");
}

export async function deleteContent(contentId: string) {
  await requireTeacher();
  await db.content.delete({ where: { id: contentId } });
  revalidatePath("/teacher/content", "layout");
  redirect("/teacher/content");
}

/* ---------- Ödev ---------- */

export async function assign(_prev: FormState, formData: FormData): Promise<FormState> {
  const teacher = await requireTeacher();
  const contentId = String(formData.get("contentId"));
  const studentIds = await ownStudentIds(teacher.id, formData.getAll("studentIds").map(String));
  if (!studentIds.length) return { error: "pickStudents" };
  const dueRaw = String(formData.get("dueAt") ?? "");
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  const note = String(formData.get("note") ?? "").trim() || null;
  await db.assignment.createMany({
    data: studentIds.map((studentId) => ({ teacherId: teacher.id, studentId, contentId, dueAt, note })),
  });
  revalidatePath("/teacher", "layout");
  return { ok: true, at: Date.now() };
}

export async function deleteAssignment(id: string) {
  const teacher = await requireTeacher();
  await db.assignment.deleteMany({ where: { id, teacherId: teacher.id } });
  revalidatePath("/teacher", "layout");
}

/* ---------- Takvim ---------- */

const LessonSchema = z.object({
  title: z.string().trim().min(1),
  startsAt: z.iso.datetime(),
  durationMin: z.coerce.number().int().min(5).max(600),
  link: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function createLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const teacher = await requireTeacher();
  const parsed = LessonSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    durationMin: formData.get("durationMin"),
    link: formData.get("link") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: "error" };
  const studentIds = await ownStudentIds(teacher.id, formData.getAll("studentIds").map(String));
  if (!studentIds.length) return { error: "pickStudents" };
  await db.lesson.create({
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      teacherId: teacher.id,
      students: { connect: studentIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/teacher", "layout");
  return { ok: true, at: Date.now() };
}

export async function deleteLesson(id: string) {
  const teacher = await requireTeacher();
  await db.lesson.deleteMany({ where: { id, teacherId: teacher.id } });
  revalidatePath("/teacher", "layout");
}

/* ---------- Paylaşımlar ---------- */

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const teacher = await requireTeacher();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "error" };
  const audience = String(formData.get("audience") ?? "all");
  let level: Level | null = null;
  let studentId: string | null = null;
  if (audience.startsWith("level:")) level = z.enum(Level).parse(audience.slice(6));
  if (audience.startsWith("student:")) {
    [studentId] = await ownStudentIds(teacher.id, [audience.slice(8)]);
    if (!studentId) return { error: "error" };
  }
  await db.post.create({
    data: {
      teacherId: teacher.id,
      body: body.slice(0, 5000),
      link: String(formData.get("link") ?? "").trim() || null,
      pinned: formData.get("pinned") === "on",
      level,
      studentId,
    },
  });
  revalidatePath("/teacher/posts");
  revalidatePath("/student", "layout");
  return { ok: true, at: Date.now() };
}

export async function togglePin(id: string) {
  const teacher = await requireTeacher();
  const post = await db.post.findFirst({ where: { id, teacherId: teacher.id } });
  if (post) await db.post.update({ where: { id }, data: { pinned: !post.pinned } });
  revalidatePath("/teacher/posts");
}

export async function deletePost(id: string) {
  const teacher = await requireTeacher();
  await db.post.deleteMany({ where: { id, teacherId: teacher.id } });
  revalidatePath("/teacher/posts");
}

/* ---------- Videolar ---------- */

export async function createVideo(_prev: FormState, formData: FormData): Promise<FormState> {
  const teacher = await requireTeacher();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const level = z.enum(Level).safeParse(formData.get("level"));
  const id = youtubeId(String(formData.get("url") ?? ""));
  if (!id) return { error: "badUrl" };
  if (!title || !level.success) return { error: "error" };
  const count = await db.video.count({ where: { teacherId: teacher.id, level: level.data } });
  if (count >= MAX_VIDEOS_PER_LEVEL) return { error: "limit" };
  await db.video.create({ data: { teacherId: teacher.id, title, youtubeId: id, level: level.data } });
  revalidatePath("/teacher/videos");
  revalidatePath("/student/watch");
  return { ok: true, at: Date.now() };
}

export async function deleteVideo(id: string) {
  const teacher = await requireTeacher();
  await db.video.deleteMany({ where: { id, teacherId: teacher.id } });
  revalidatePath("/teacher/videos");
  revalidatePath("/student/watch");
}
