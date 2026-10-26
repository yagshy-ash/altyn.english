// Bütün seviyeler için başlangıç içeriğini üretir. Tekrar çalıştırılabilir:
// aynı seviye + beceri + konu zaten varsa atlanır.
//   npm run content:generate            (hepsi)
//   npm run content:generate -- B1      (tek seviye)
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Level, Skill } from "../src/generated/prisma/enums";
import { generateContent } from "../src/lib/ai";
import { GRAMMAR, TOPICS, VOCAB_THEMES } from "../src/lib/syllabus";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const CONCURRENCY = 8;

type Job = { skill: Skill; level: Level; topic: string; items?: string[] };
type Materials = {
  irregularVerbs: { base: string; past: string; participle: string; level: Level }[];
  verbs: { word: string; level: Level }[];
  idioms: { idiom: string; level: Level }[];
  topics: { topic: string; level: Level }[];
};

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEFL"];
const m: Materials = JSON.parse(readFileSync("prisma/data/materials.json", "utf8"));

function chunk<T>(list: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function plan(level: Level): Job[] {
  const jobs: Job[] = [];
  // Materyal konuları (Improve Your English, Effortless English) + müfredat konuları
  const topics = [...m.topics.filter((t) => t.level === level).map((t) => t.topic), ...TOPICS[level]];
  const take = (n: number, offset: number) => Array.from({ length: n }, (_, i) => topics[(offset + i) % topics.length]);

  take(4, 0).forEach((topic) => jobs.push({ skill: "READING", level, topic }));
  take(level === "TOEFL" ? 3 : 2, 4).forEach((topic) => jobs.push({ skill: "LISTENING", level, topic }));
  take(2, 7).forEach((topic) => jobs.push({ skill: "WRITING", level, topic }));
  take(2, 9).forEach((topic) => jobs.push({ skill: "SPEAKING", level, topic }));
  GRAMMAR[level].slice(0, 4).forEach((topic) => jobs.push({ skill: "GRAMMAR", level, topic }));
  VOCAB_THEMES[level].slice(0, 2).forEach((topic) => jobs.push({ skill: "VOCABULARY", level, topic }));

  if (level !== "TOEFL") {
    chunk(m.irregularVerbs.filter((v) => v.level === level), 10)
      .slice(0, 2)
      .forEach((set, i) =>
        jobs.push({ skill: "VOCABULARY", level, topic: `Irregular verbs ${level} · ${i + 1}`, items: set.map((v) => `${v.base} – ${v.past} – ${v.participle}`) }),
      );
    chunk(m.verbs.filter((v) => v.level === level), 12)
      .slice(0, 3)
      .forEach((set, i) => jobs.push({ skill: "VOCABULARY", level, topic: `Common verbs ${level} · ${i + 1}`, items: set.map((v) => v.word) }));
    chunk(m.idioms.filter((v) => v.level === level), 10).forEach((set, i) =>
      jobs.push({ skill: "VOCABULARY", level, topic: `Idioms ${level} · ${i + 1}`, items: set.map((v) => v.idiom) }),
    );
  }
  return jobs;
}

async function run(job: Job) {
  const exists = await db.content.findFirst({ where: { skill: job.skill, level: job.level, topic: job.topic }, select: { id: true } });
  if (exists) return "skip";
  const out = await generateContent(job);
  await db.content.create({
    // Konu, tekrar çalıştırmada eşleşsin diye plandaki değerle kaydedilir
    data: { skill: job.skill, level: job.level, topic: job.topic, title: out.title, body: out.body as object },
  });
  return "ok";
}

async function main() {
  const only = process.argv[2] as Level | undefined;
  const jobs = (only ? [only] : LEVELS).flatMap(plan);
  console.log(`${jobs.length} içerik planlandı`);
  let done = 0, failed = 0, skipped = 0;
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          const r = await run(job);
          if (r === "skip") skipped++;
          else done++;
        } catch (e) {
          failed++;
          console.error(`✗ ${job.level} ${job.skill} "${job.topic}": ${(e as Error).message}`);
        }
        const n = done + failed + skipped;
        if (n % 5 === 0 || n === jobs.length) console.log(`${n}/${jobs.length} (yeni ${done}, atlanan ${skipped}, hata ${failed})`);
      }
    }),
  );
  await db.$disconnect();
}

main();
