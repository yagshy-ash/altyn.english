// Claude Code ile elle üretilen içerikler için yardımcı (API kredisi harcamaz).
//   npm run content:manual -- pending [n]   → henüz üretilmemiş konuları listeler (batch'te bekleyenler hariç)
//   npm run content:manual -- import        → prisma/data/manual/*.json dosyalarını doğrulayıp veritabanına ekler
// JSON dosyası: [{ "skill", "level", "topic", "title", "body" }, ...]  (body: src/lib/content-schemas.ts)
import "dotenv/config";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from "node:fs";
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { BODY_SCHEMAS, missingPart } from "../src/lib/content-schemas";
import { sanitize } from "../src/lib/ai";
import { Level, Skill } from "../src/generated/prisma/enums";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DIR = "prisma/data/manual";
const DONE = `${DIR}/imported`;
// İçerik olmayan sayfalar: link listeleri ve sitenin menü öğeleri
const JUNK =
  /\b(sites|links|dictionar\w*|newsletter|download|privacy|sitemap|press|about us|faq|parents|top news|games|english lessons|levels|explanations|grammar exercises|vocabulary exercises)\b|: (complex )?(tests|exams)$/i;

type Topic = { section: string; topic: string; skill: Skill; level: Level };

async function pending(n = 20) {
  const topics: Topic[] = JSON.parse(readFileSync("prisma/data/eh-topics.json", "utf8"));
  const have = new Set(
    (await db.content.findMany({ select: { skill: true, level: true, topic: true } })).map((c) => `${c.skill}|${c.level}|${c.topic}`),
  );
  // Gönderilmiş batch'lerdeki konular (sonuçları henüz gelmemiş olabilir)
  for (const f of readdirSync("prisma/data").filter((f) => f.startsWith("batch-"))) {
    for (const j of Object.values(JSON.parse(readFileSync(`prisma/data/${f}`, "utf8"))) as { skill: string; level: string; topic: string }[])
      have.add(`${j.skill}|${j.level}|${j.topic}`);
  }
  // Elle yazılıp henüz içe aktarılmamış dosyalar
  if (existsSync(DIR))
    for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json")))
      for (const c of JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")) as Topic[]) have.add(`${c.skill}|${c.level}|${c.topic}`);

  const left = topics
    .map((t) => ({ skill: t.skill, level: t.level, topic: `${t.section}: ${t.topic}` }))
    .filter((t) => !JUNK.test(t.topic) && !have.has(`${t.skill}|${t.level}|${t.topic}`));
  console.log(`Kalan: ${left.length}`);
  for (const t of left.slice(0, n)) console.log(JSON.stringify(t));
}

async function importAll() {
  mkdirSync(DONE, { recursive: true });
  let saved = 0, skipped = 0;
  for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
    const items = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")) as unknown[];
    const errors: string[] = [];
    for (const [i, raw] of items.entries()) {
      const head = z.object({ skill: z.enum(Skill), level: z.enum(Level), topic: z.string(), title: z.string() }).safeParse(raw);
      if (!head.success) {
        errors.push(`#${i}: ${head.error.issues[0].message}`);
        continue;
      }
      const body = BODY_SCHEMAS[head.data.skill].safeParse((raw as { body: unknown }).body);
      if (!body.success) {
        errors.push(`#${i} ${head.data.topic}: ${body.error.issues[0].path.join(".")} ${body.error.issues[0].message}`);
        continue;
      }
      const missing = missingPart(head.data.skill, body.data);
      if (missing) {
        errors.push(`#${i} ${head.data.topic}: ${missing} eksik`);
        continue;
      }
      // Aynı şık iki kez olmasın, cevap indeksi şıkların içinde olsun
      const items = [
        ...((body.data as { questions?: { options: string[]; answer: number }[] }).questions ?? []),
        ...((body.data as { exercises?: { options: string[]; answer: number }[] }).exercises ?? []),
      ];
      const bad = items.findIndex((q) => new Set(q.options).size !== q.options.length || q.answer < 0 || q.answer >= q.options.length);
      if (bad >= 0) {
        errors.push(`#${i} ${head.data.topic}: soru ${bad + 1} şıkları/cevabı hatalı`);
        continue;
      }
      // tr/tk alanlarında Kiril harf olmasın (Latin a ile Kiril а karışması gibi)
      const mixed: string[] = [];
      const scan = (v: unknown, key = ""): void => {
        if (typeof v === "string") {
          if ((key === "tr" || key === "tk") && /[Ѐ-ӿ]/.test(v)) mixed.push(v.slice(0, 40));
        } else if (Array.isArray(v)) v.forEach((x) => scan(x));
        else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => scan(x, k));
      };
      scan(body.data);
      if (mixed.length) {
        errors.push(`#${i} ${head.data.topic}: tr/tk alanında Kiril harf: "${mixed[0]}"`);
        continue;
      }
      const { skill, level, topic, title } = head.data;
      if (await db.content.findFirst({ where: { skill, level, topic }, select: { id: true } })) {
        skipped++;
        continue;
      }
      await db.content.create({ data: { skill, level, topic, title, body: sanitize(body.data) as object } });
      saved++;
    }
    if (errors.length) console.log(`${f}:\n  ${errors.join("\n  ")}`);
    else renameSync(`${DIR}/${f}`, `${DONE}/${f}`);
  }
  console.log(`Kaydedilen ${saved}, zaten var ${skipped}`);
}

const [cmd, arg] = process.argv.slice(2);
(cmd === "pending" ? pending(arg ? Number(arg) : undefined) : cmd === "import" ? importAll() : Promise.reject(new Error("pending [n] | import")))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
