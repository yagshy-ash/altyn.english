"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/dal";
import { visibleContentWhere } from "@/lib/content";
import { chatOpening, chatTurn, evaluateAnswer, explainText, isAiUnavailable } from "@/lib/ai";
import { SCENARIOS } from "@/lib/scenarios";
import type { Feedback, GrammarBody, ListeningBody, ReadingBody, VocabularyBody, WritingBody, SpeakingBody } from "@/lib/content-schemas";
import type { Skill } from "@/generated/prisma/enums";

// Leitner kutuları: bildikçe tekrar aralığı (gün) uzar
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];

async function visibleContent(contentId: string) {
  const student = await requireStudent();
  const content = await db.content.findFirst({ where: { id: contentId, ...visibleContentWhere(student.level) } });
  if (!content) throw new Error("Content not available");
  return { student, content };
}

type MistakeInput = { type: string; wrong: string; right: string; explanation?: string };

// Yapay zekâlı action'lar hata fırlatmaz: production'da hata mesajı istemciye ulaşmadığı için
// "AI kullanılamıyor" durumu sonuçla bildirilir
export type AiResult<T> = { ok: true; data: T } | { ok: false; reason: "ai" | "error" };

async function aiResult<T>(fn: () => Promise<T>): Promise<AiResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    console.error(e);
    return { ok: false, reason: isAiUnavailable(e) ? "ai" : "error" };
  }
}

// Her çalışma tek yerden kaydedilir: deneme + hatalar + ilgili ödevin tamamlanması
async function recordAttempt(opts: {
  studentId: string;
  skill: Skill;
  contentId?: string;
  score: number;
  durationSec: number;
  answers?: object;
  feedback?: object;
  levelGuess?: Feedback["levelGuess"];
  mistakes: MistakeInput[];
}) {
  const { studentId, skill, contentId, mistakes, ...rest } = opts;
  const assignment = contentId
    ? await db.assignment.findFirst({ where: { studentId, contentId, completedAt: null }, orderBy: { createdAt: "asc" } })
    : null;
  const attempt = await db.attempt.create({
    data: {
      studentId,
      skill,
      contentId,
      assignmentId: assignment?.id,
      score: rest.score,
      durationSec: Math.max(0, Math.min(rest.durationSec, 4 * 3600)),
      answers: rest.answers,
      feedback: rest.feedback,
      levelGuess: rest.levelGuess,
      mistakes: { create: mistakes.map((m) => ({ ...m, studentId, skill })) },
    },
  });
  if (assignment) await db.assignment.update({ where: { id: assignment.id }, data: { completedAt: new Date() } });
  if (rest.levelGuess) await db.levelSnapshot.create({ data: { studentId, level: rest.levelGuess, skill, source: "ai" } });
  return attempt;
}

// Yazma/konuşma hataları kart destesine: ön yüz doğru hali, arka yüz açıklama + yanlış hali
async function addMistakeCards(studentId: string, mistakes: { wrong: string; right: string; why: string }[]) {
  await db.vocabCard.createMany({
    data: mistakes
      .filter((m) => m.right && m.right !== m.wrong)
      .map((m) => ({ studentId, word: m.right.slice(0, 200), translation: m.why, example: m.wrong, source: "mistake" })),
    skipDuplicates: true,
  });
}

/* ---------- Quiz: okuma, dinleme, gramer ---------- */

export async function submitQuiz(contentId: string, answers: number[], durationSec: number) {
  const { student, content } = await visibleContent(contentId);
  const body = content.body as ReadingBody | ListeningBody | GrammarBody;
  const items = "exercises" in body ? body.exercises : body.questions;
  const correct = items.map((q, i) => answers[i] === q.answer);
  const score = Math.round((correct.filter(Boolean).length / Math.max(1, items.length)) * 100);

  await recordAttempt({
    studentId: student.id,
    skill: content.skill,
    contentId,
    score,
    durationSec,
    answers: { answers },
    mistakes: items.flatMap((q, i) =>
      correct[i]
        ? []
        : [
            {
              type: content.skill === "GRAMMAR" ? "grammar" : "comprehension",
              wrong: q.options[answers[i]] ?? "—",
              right: q.options[q.answer],
              explanation: `${q.question} — ${q.explanation[student.locale]}`,
            },
          ],
    ),
  });
  revalidatePath("/student", "layout");
  return { score, correct };
}

/* ---------- Kelime ---------- */

export async function addSetToDeck(contentId: string) {
  const { student, content } = await visibleContent(contentId);
  const body = content.body as VocabularyBody;
  await db.vocabCard.createMany({
    data: body.words.map((w) => ({ studentId: student.id, word: w.word, translation: w[student.locale], example: w.example })),
    skipDuplicates: true,
  });
  await db.assignment.updateMany({ where: { studentId: student.id, contentId, completedAt: null }, data: { completedAt: new Date() } });
  revalidatePath("/student", "layout");
}

export async function reviewCard(cardId: string, known: boolean) {
  const student = await requireStudent();
  const card = await db.vocabCard.findFirst({ where: { id: cardId, studentId: student.id } });
  if (!card) return;
  const box = known ? Math.min(card.box + 1, INTERVALS.length - 1) : 0;
  const dueAt = new Date(Date.now() + (known ? INTERVALS[box] * 86400_000 : 10 * 60_000));
  await db.vocabCard.update({
    where: { id: card.id },
    data: { box, dueAt, reviews: { increment: 1 }, lapses: known ? undefined : { increment: 1 } },
  });
}

export async function finishReview(results: { cardId: string; known: boolean }[], durationSec: number) {
  const student = await requireStudent();
  if (!results.length) return;
  const missed = await db.vocabCard.findMany({
    where: { studentId: student.id, id: { in: results.filter((r) => !r.known).map((r) => r.cardId) } },
  });
  await recordAttempt({
    studentId: student.id,
    skill: "VOCABULARY",
    score: Math.round((results.filter((r) => r.known).length / results.length) * 100),
    durationSec,
    answers: { reviewed: results.length },
    mistakes: missed.map((c) => ({ type: "vocabulary", wrong: c.word, right: c.translation })),
  });
  revalidatePath("/student", "layout");
}

/* ---------- Yazma ve konuşma ---------- */

async function evaluateAndRecord(kind: "writing" | "speaking", contentId: string, answer: string, durationSec: number) {
  const { student, content } = await visibleContent(contentId);
  const text = answer.trim().slice(0, 6000);
  if (text.split(/\s+/).length < 3) throw new Error("Too short");
  const body = content.body as WritingBody | SpeakingBody;
  const task = "taskEn" in body ? body.taskEn : body.questionEn;
  const feedback = await evaluateAnswer({ kind, task, answer: text, level: student.level, locale: student.locale });
  await recordAttempt({
    studentId: student.id,
    skill: content.skill,
    contentId,
    score: feedback.score,
    durationSec,
    answers: { text },
    feedback,
    levelGuess: feedback.levelGuess,
    mistakes: feedback.mistakes.map((m) => ({ type: m.type, wrong: m.wrong, right: m.right, explanation: m.why })),
  });
  await addMistakeCards(student.id, feedback.mistakes);
  revalidatePath("/student", "layout");
  return feedback;
}

export async function submitWriting(contentId: string, text: string, durationSec: number) {
  return aiResult(() => evaluateAndRecord("writing", contentId, text, durationSec));
}

export async function submitSpeaking(contentId: string, transcript: string, durationSec: number) {
  return aiResult(() => evaluateAndRecord("speaking", contentId, transcript, durationSec));
}

/* ---------- Bunu anlamadım ---------- */

export async function explain(text: string) {
  const student = await requireStudent();
  const clean = text.trim().slice(0, 6000);
  if (!clean) throw new Error("Empty");
  return aiResult(() => explainText(clean, student.level, student.locale));
}

/* ---------- Sohbet / rol yapma ---------- */

type ChatMessage = { role: "student" | "partner"; text: string };

function scenarioById(id: string) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error("Unknown scenario");
  return s;
}

export async function startChat(scenarioId: string) {
  const student = await requireStudent();
  return aiResult(() => chatOpening(scenarioById(scenarioId).prompt, student.level));
}

export async function sendChat(scenarioId: string, history: ChatMessage[]) {
  const student = await requireStudent();
  const s = scenarioById(scenarioId);
  return aiResult(async () => {
    const turn = await chatTurn({ scenario: s.prompt, level: student.level, locale: student.locale, history: history.slice(-30) });
    const last = history.at(-1);
    if (turn.fix.hasError && last?.role === "student") {
      await db.mistake.create({
        data: { studentId: student.id, skill: "SPEAKING", type: "other", wrong: last.text.slice(0, 500), right: turn.fix.corrected, explanation: turn.fix.why },
      });
      await addMistakeCards(student.id, [{ wrong: last.text, right: turn.fix.corrected, why: turn.fix.why }]);
    }
    return turn;
  });
}

export async function endChat(scenarioId: string, history: ChatMessage[], durationSec: number) {
  return aiResult(() => scoreChat(scenarioId, history, durationSec));
}

async function scoreChat(scenarioId: string, history: ChatMessage[], durationSec: number) {
  const student = await requireStudent();
  const s = scenarioById(scenarioId);
  const said = history.filter((m) => m.role === "student").map((m) => m.text);
  if (said.length < 3) throw new Error("Too short");
  const feedback = await evaluateAnswer({
    kind: "writing",
    task: `Role-play chat. ${s.prompt} Goal for the student: ${s.goal.tr}. The text below is everything the student wrote, one message per line.`,
    answer: said.join("\n"),
    level: student.level,
    locale: student.locale,
  });
  await recordAttempt({
    studentId: student.id,
    skill: "SPEAKING",
    score: feedback.score,
    durationSec,
    answers: { scenario: s.id, history },
    feedback,
    levelGuess: feedback.levelGuess,
    mistakes: [], // mesaj mesaj zaten kaydedildi
  });
  revalidatePath("/student", "layout");
  return feedback;
}
