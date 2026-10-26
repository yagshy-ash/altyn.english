import { z } from "zod";

// Her içerik türünün `Content.body` yapısı. Yapay zeka bu şemalara uygun JSON üretir
// (structured outputs), öğrenci sayfaları da aynı tiplerle render eder.
// Not: structured outputs sayısal/uzunluk kısıtlarını desteklemez; adetleri prompt belirtir.

const L3 = z.object({ tr: z.string(), tk: z.string(), ru: z.string() });
export type L3 = z.infer<typeof L3>;

const Gloss = z.object({ word: z.string(), tr: z.string(), tk: z.string(), ru: z.string() });

const Question = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.number().int(), // options içindeki doğru cevabın indeksi
  explanation: L3,
});
export type Question = z.infer<typeof Question>;

export const ReadingBody = z.object({
  passage: z.array(z.string()), // paragraflar
  glossary: z.array(Gloss),
  questions: z.array(Question),
});

// Dinleme metni ekranda gösterilmez; tarayıcı sesi (speechSynthesis) okur
export const ListeningBody = z.object({
  script: z.array(z.string()),
  glossary: z.array(Gloss),
  questions: z.array(Question),
});

export const VocabularyBody = z.object({
  words: z.array(
    z.object({ word: z.string(), pos: z.string(), example: z.string(), tr: z.string(), tk: z.string(), ru: z.string() }),
  ),
});

export const GrammarBody = z.object({
  explanation: L3,
  examples: z.array(z.object({ en: z.string(), tr: z.string(), tk: z.string(), ru: z.string() })),
  exercises: z.array(Question), // question içinde boşluk "___" ile gösterilir
});

export const WritingBody = z.object({
  task: L3,
  taskEn: z.string(),
  minWords: z.number().int(),
  hints: z.array(z.string()),
});

export const SpeakingBody = z.object({
  task: L3,
  questionEn: z.string(),
  targetSeconds: z.number().int(),
  hints: z.array(z.string()),
});

export const BODY_SCHEMAS = {
  READING: ReadingBody,
  LISTENING: ListeningBody,
  VOCABULARY: VocabularyBody,
  GRAMMAR: GrammarBody,
  WRITING: WritingBody,
  SPEAKING: SpeakingBody,
} as const;

export type ReadingBody = z.infer<typeof ReadingBody>;
export type ListeningBody = z.infer<typeof ListeningBody>;
export type VocabularyBody = z.infer<typeof VocabularyBody>;
export type GrammarBody = z.infer<typeof GrammarBody>;
export type WritingBody = z.infer<typeof WritingBody>;
export type SpeakingBody = z.infer<typeof SpeakingBody>;

// Yapay zeka değerlendirmesi (yazma ve konuşma)
export const MISTAKE_TYPES = [
  "tense",
  "article",
  "preposition",
  "word_order",
  "word_choice",
  "spelling",
  "agreement",
  "plural",
  "punctuation",
  "pronunciation",
  "other",
] as const;

export const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const Feedback = z.object({
  score: z.number().int(), // 0–100
  levelGuess: z.enum(CEFR),
  summary: z.string(), // öğrencinin dilinde
  corrected: z.string(),
  natural: z.string(),
  mistakes: z.array(
    z.object({ type: z.enum(MISTAKE_TYPES), wrong: z.string(), right: z.string(), why: z.string() }),
  ),
  tip: z.string(),
});
export type Feedback = z.infer<typeof Feedback>;

// Content kaydı oluşturmak için yapay zekanın döndürdüğü üst bilgi
export const Meta = z.object({ title: z.string(), topic: z.string() });
