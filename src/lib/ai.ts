// Claude API: içerik üretimi ve yazma/konuşma değerlendirmesi.
// "server-only" import edilmez çünkü scripts/ altındaki toplu üretim de bu modülü kullanır;
// istemci bileşenleri bu dosyayı import etmemeli (API anahtarı sunucuda kalır).
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { BODY_SCHEMAS, Feedback, missingPart, ReadingBody } from "./content-schemas";
import type { Level, Skill } from "@/generated/prisma/enums";

const MODEL = "claude-haiku-5-5";
// Oluşturma ilk çağrıya kadar ertelenir: anahtar yoksa modül yüklenirken değil, çağrıda hata verir
let anthropic: Anthropic | undefined;
const client = () => (anthropic ??= new Anthropic({ maxRetries: 2 }));

// API anahtarı yok, kredi bitti, servis kapalı vb. — yapay zekâ özellikleri şu an kullanılamaz
export function isAiUnavailable(e: unknown) {
  return e instanceof Anthropic.AnthropicError;
}

const SYSTEM = `You write English-learning materials for students whose native languages are Turkish, Turkmen and Russian.
- English content must match the requested CEFR level exactly: vocabulary, sentence length and grammar.
- Every translation field must be natural and accurate. "tk" is standard Turkmen in Latin script (letters such as ä, ç, ň, ö, ş, ü, ý, ž) — never Turkish. "ru" is Russian in Cyrillic.
- Content is original. Do not copy text from published textbooks.
- Content is culturally neutral and appropriate for teenagers and adults.
- In multiple-choice items, exactly one option is correct, "answer" is its zero-based index, and the correct position varies between items.`;

const LEVEL_GUIDE: Record<Level, string> = {
  A1: "A1: very short simple sentences, present simple, the 500 most common words.",
  A2: "A2: short sentences, past simple and future forms, everyday topics.",
  B1: "B1: connected paragraphs, present perfect, conditionals, opinions with reasons.",
  B2: "B2: detailed texts, a range of tenses and linking words, abstract topics.",
  C1: "C1: complex, nuanced language, idiomatic expressions, academic and professional register.",
  C2: "C2: sophisticated, native-like language with subtle meaning.",
  TOEFL:
    "TOEFL iBT preparation: academic topics (university lecture or textbook style, B2–C1), question types like the real exam (factual, negative factual, inference, vocabulary-in-context, rhetorical purpose).",
};

const PASSAGE_WORDS: Record<Level, number> = { A1: 120, A2: 180, B1: 280, B2: 380, C1: 480, C2: 550, TOEFL: 600 };
const SCRIPT_WORDS: Record<Level, number> = { A1: 80, A2: 120, B1: 180, B2: 250, C1: 320, C2: 360, TOEFL: 400 };

function skillBrief(skill: Skill, level: Level, items?: string[]) {
  switch (skill) {
    case "READING":
      return `A reading text of about ${PASSAGE_WORDS[level]} words split into paragraphs, a glossary of 8–12 key words or phrases from the text, and ${level === "TOEFL" ? 6 : 5} comprehension questions with 4 options each. Question text is in English.`;
    case "LISTENING":
      return `A listening script of about ${SCRIPT_WORDS[level]} words that a text-to-speech voice will read aloud. Write it as ${level === "TOEFL" ? "a short academic lecture or a campus conversation" : "a natural dialogue or monologue"}; for a dialogue start each line with the speaker's first name and a colon. Each array item is one line or short paragraph. Include a glossary of 6–10 key words and 5 questions with 4 options each, answerable only by listening.`;
    case "VOCABULARY":
      return items?.length
        ? `A vocabulary set built from exactly these items, in this order: ${items.join("; ")}. "word" keeps the item as given, "pos" is the part of speech (or "idiom" / "irregular verb"), "example" is one clear example sentence at this level, and tr/tk/ru are the meanings.`
        : `A vocabulary set of 12 useful words or short phrases on the topic, with part of speech, one example sentence at this level, and translations.`;
    case "GRAMMAR":
      return `A grammar lesson. "explanation" explains the rule in each student language (120–220 words each, may use line breaks and "•" bullet lines, English examples may appear inline). 6 example sentences with translations. 12 practice items that drill exactly this topic, mixing formats: gap-fill sentences (gap written as ___), "Choose the correct sentence", word-order and error-spotting items; 3 or 4 options each and a short explanation in all three languages.`;
    case "WRITING":
      return `A writing task. "task" tells the student what to write in each student language, "taskEn" is the same task in English, "minWords" suits the level (A1 40, A2 60, B1 100, B2 150, C1 200, C2 250, TOEFL 300 for an independent essay or 150 for an integrated summary), and 3–5 "hints" are useful English phrases.`;
    case "SPEAKING":
      return `A speaking task the student answers aloud. "task" explains it in each student language, "questionEn" is the question in English, "targetSeconds" suits the level (A1 30, A2 45, B1 60, B2 75, C1 90, C2 90, TOEFL 45), and 3–5 "hints" are useful English sentence starters.`;
  }
}

export type GeneratedContent = { title: string; topic: string; body: unknown };

export type ContentJob = { skill: Skill; level: Level; topic: string; items?: string[] };

// Tekli üretim ve toplu (batch) üretim aynı prompt ve şemayı kullanır
export function contentSchema(skill: Skill) {
  return z.object({ title: z.string(), topic: z.string(), body: BODY_SCHEMAS[skill] });
}

export function contentPrompt({ skill, level, topic, items }: ContentJob) {
  return {
    system: SYSTEM,
    user: `Level: ${LEVEL_GUIDE[level]}\nSkill: ${skill}\nTopic: ${topic}\n\nCreate: ${skillBrief(skill, level, items)}\n"title" is a short English title; "topic" is the topic in a few English words.`,
  };
}

export async function generateContent(job: ContentJob): Promise<GeneratedContent> {
  const { system, user } = contentPrompt(job);
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(contentSchema(job.skill)) },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Generation failed (${response.stop_reason}) for ${job.skill} ${job.level} "${job.topic}"`);
  }
  const out = response.parsed_output;
  const body = sanitize(out.body);
  const missing = missingPart(job.skill, body);
  if (missing) throw new Error(`Generation incomplete (no ${missing}) for ${job.skill} ${job.level} "${job.topic}"`);
  return { title: out.title, topic: out.topic, body };
}

// Öğretmenin kendi metni: metin olduğu gibi kalır, yalnızca kelime listesi ve sorular üretilir
const TextQuiz = ReadingBody.pick({ glossary: true, questions: true }).extend({ title: z.string(), topic: z.string() });

export async function quizForText(opts: { text: string; level: Level; skill: "READING" | "LISTENING"; count: number }) {
  const user = `Level: ${LEVEL_GUIDE[opts.level]}
The teacher wrote the text below for ${opts.skill === "LISTENING" ? "a listening exercise (students hear it read aloud and do not see it)" : "a reading exercise"}. Do not rewrite or correct the text.
Create:
- "glossary": 8–12 words or phrases that appear in the text and may be new at this level, with tr/tk/ru meanings as used in the text.
- "questions": exactly ${opts.count} multiple-choice comprehension questions in English with 4 options each, answerable only from the text${opts.skill === "LISTENING" ? " by listening" : ""}. Mix detail, main-idea and inference questions suited to the level; each has a short explanation in all three languages.
- "title": a short English title for the text; "topic": the topic in a few English words.

<text>
${opts.text}
</text>`;
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(TextQuiz) },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`Text quiz failed (${response.stop_reason})`);
  return sanitize(response.parsed_output);
}

// Model bazen Latin Türkmence/Türkçe içine Kiril harf karıştırıyor (bölegінде, toparы).
// tr/tk alanlarındaki Kiril harfleri Türkmen Latin karşılığına çevirir.
const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "w", г: "g", д: "d", е: "e", ё: "ýo", ж: "j", җ: "j", з: "z", и: "i", і: "i", й: "ý", к: "k",
  л: "l", м: "m", н: "n", ң: "ň", о: "o", ө: "ö", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "ü", ф: "f", х: "h", ц: "s",
  ч: "ç", ш: "ş", щ: "ş", ы: "y", э: "e", ә: "ä", ю: "ýu", я: "ýa", ь: "", ъ: "",
};
function latinize(s: string) {
  return s.replace(/[Ѐ-ӿ]/g, (ch) => {
    const lower = ch.toLowerCase();
    const lat = CYR_TO_LAT[lower] ?? ch;
    return ch === lower ? lat : lat.charAt(0).toUpperCase() + lat.slice(1);
  });
}
export function fixLatinFields<T>(v: T, key = ""): T {
  if (typeof v === "string") return ((key === "tr" || key === "tk") ? latinize(v) : v) as T;
  if (Array.isArray(v)) return v.map((x) => fixLatinFields(x)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fixLatinFields(x, k)])) as T;
  return v;
}

// Hatalı indeksli soruları ayıkla, tr/tk alanlarını düzelt
export function sanitize<T>(input: T): T {
  const body = fixLatinFields(input);
  const b = body as { questions?: { options: string[]; answer: number }[]; exercises?: { options: string[]; answer: number }[] };
  const ok = (q: { options: string[]; answer: number }) => q.answer >= 0 && q.answer < q.options.length;
  if (b.questions) b.questions = b.questions.filter(ok);
  if (b.exercises) b.exercises = b.exercises.filter(ok);
  return body;
}

const LANG_NAME = { tr: "Turkish", tk: "Turkmen (Latin script)", ru: "Russian" } as const;

export async function evaluateAnswer(opts: {
  kind: "writing" | "speaking";
  task: string;
  answer: string;
  level: Level;
  locale: keyof typeof LANG_NAME;
}): Promise<Feedback> {
  const { kind, task, answer, level, locale } = opts;
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "medium", format: betaZodOutputFormat(Feedback) },
    system: `You are a kind but precise English teacher assessing a ${level === "TOEFL" ? "TOEFL candidate" : `${level} learner`}.
Write "summary", every mistake's "why" and "tip" in ${LANG_NAME[locale]}; keep them short and encouraging.
"corrected" fixes only the errors and keeps the student's wording; "natural" is how a fluent speaker would say the same thing.
List each distinct error once (maximum 10), "wrong" and "right" are short exact fragments.
"score" is 0–100 for how well the answer completes the task at the student's level. "levelGuess" is the CEFR level the answer itself shows.
${kind === "speaking" ? 'The answer is an automatic speech-to-text transcript: ignore missing punctuation and capitalisation, and use type "pronunciation" only when a word was clearly transcribed as a different, similar-sounding word.' : ""}`,
    messages: [{ role: "user", content: `Task: ${task}\n\nStudent's ${kind === "speaking" ? "spoken answer (transcript)" : "text"}:\n${answer}` }],
  });
  if (!response.parsed_output) throw new Error(`Evaluation failed (${response.stop_reason})`);
  return response.parsed_output;
}

// Öğretmenin materyal metinlerinden yapılandırılmış liste çıkarma (scripts/import-materials.ts)
export async function extractList<T extends z.ZodType>(instruction: string, text: string, schema: T): Promise<z.infer<T>> {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: `${instruction}\n\n<material>\n${text}\n</material>` }],
  });
  if (!response.parsed_output) throw new Error(`Extraction failed (${response.stop_reason})`);
  return response.parsed_output;
}

// "Bunu anlamadım": öğrencinin yapıştırdığı metni kendi dilinde açıklar
export const Explanation = z.object({
  summary: z.string(),
  sentences: z.array(z.object({ en: z.string(), meaning: z.string() })),
  vocab: z.array(z.object({ word: z.string(), meaning: z.string() })),
  grammar: z.array(z.object({ pattern: z.string(), note: z.string() })),
});
export type Explanation = z.infer<typeof Explanation>;

export async function explainText(text: string, level: Level, locale: keyof typeof LANG_NAME): Promise<Explanation> {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 12000,
    output_config: { effort: "low", format: betaZodOutputFormat(Explanation) },
    system: `You help a ${level} English learner understand a text they could not follow. Write every explanation in ${LANG_NAME[locale]}.
"summary": 2–4 sentences on what the text says. "sentences": the text split into sentences (at most 15, the hardest ones if longer) with a plain-language meaning. "vocab": up to 12 words or phrases above the learner's level with meanings. "grammar": up to 4 structures worth noticing, each with a short note.`,
    messages: [{ role: "user", content: text }],
  });
  if (!response.parsed_output) throw new Error(`Explain failed (${response.stop_reason})`);
  return response.parsed_output;
}

// Sohbet / rol yapma: karakter cevabı + öğrencinin son mesajının düzeltmesi
export const ChatTurn = z.object({
  reply: z.string(),
  fix: z.object({ hasError: z.boolean(), corrected: z.string(), why: z.string() }),
});
export type ChatTurn = z.infer<typeof ChatTurn>;

export async function chatTurn(opts: {
  scenario: string;
  level: Level;
  locale: keyof typeof LANG_NAME;
  history: { role: "student" | "partner"; text: string }[];
}): Promise<ChatTurn> {
  const { scenario, level, locale, history } = opts;
  const transcript = history.map((m) => `${m.role === "student" ? "STUDENT" : "YOU"}: ${m.text}`).join("\n");
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(ChatTurn) },
    system: `Role-play for an English learner (${LEVEL_GUIDE[level]}). ${scenario}
Stay in character. "reply": your next line, 1–3 short sentences at the learner's level, ending with something the learner can respond to.
"fix" is about the STUDENT's last message only: "hasError" true only for real grammar or word errors (ignore capitalisation and missing final punctuation); "corrected" is the corrected message (or the same message); "why" briefly explains the fix in ${LANG_NAME[locale]} (empty when there is no error).`,
    messages: [{ role: "user", content: transcript }],
  });
  if (!response.parsed_output) throw new Error(`Chat failed (${response.stop_reason})`);
  return response.parsed_output;
}

// Sohbet başlangıcı: karakterin ilk cümlesi
export async function chatOpening(scenario: string, level: Level): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: `Role-play for an English learner (${LEVEL_GUIDE[level]}). ${scenario} Reply with only your first line in character: 1–2 short sentences that invite an answer.`,
    messages: [{ role: "user", content: "Start the conversation." }],
  });
  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "Hello!";
}
