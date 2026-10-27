// prisma/data/eh-topics.json'daki konu haritasından (englisch-hilfen.de kapsamı) özgün içerik üretir.
// Message Batches API ile (%50 ucuz). Kullanım:
//   npm run content:batch -- submit [limit]     → batch'i gönderir (limit: en fazla kaç konu), id'yi yazdırır
//   npm run content:batch -- collect <batchId>  → bitmesini bekler, sonuçları veritabanına yazar
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { contentPrompt, contentSchema, sanitize, type ContentJob } from "../src/lib/ai";
import { missingPart } from "../src/lib/content-schemas";

const MODEL = "claude-sonnet-5-5";
const client = new Anthropic({ maxRetries: 5 });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Topic = { section: string; topic: string; skill: ContentJob["skill"]; level: ContentJob["level"]; exercises: number };
// İçerik olmayan sayfalar (link listeleri vb.)
// İçerik olmayan sayfalar: link listeleri ve sitenin menü öğeleri
const JUNK =
  /\b(sites|links|dictionar\w*|newsletter|download|privacy|sitemap|press|about us|faq|parents|top news|games|english lessons|levels|explanations|grammar exercises|vocabulary exercises)\b|: (complex )?(tests|exams)$/i;

const jobsFile = (id: string) => `prisma/data/batch-${id}.json`;

async function submit(limit = Infinity) {
  const topics: Topic[] = JSON.parse(readFileSync("prisma/data/eh-topics.json", "utf8"));
  const existing = new Set(
    (await db.content.findMany({ select: { skill: true, level: true, topic: true } })).map((c) => `${c.skill}|${c.level}|${c.topic}`),
  );
  // Limit varsa beceri × seviye gruplarından sırayla seç: her bölümden dengeli pay
  const groups = new Map<string, [string, ContentJob][]>();
  topics.forEach((t, i) => {
    const job: ContentJob = { skill: t.skill, level: t.level, topic: `${t.section}: ${t.topic}` };
    if (JUNK.test(job.topic) || existing.has(`${job.skill}|${job.level}|${job.topic}`)) return;
    const key = `${t.skill}|${t.level}`;
    groups.set(key, [...(groups.get(key) ?? []), [`eh-${i}`, job]]);
  });
  const jobs: Record<string, ContentJob> = {};
  const lists = [...groups.values()];
  for (let round = 0, added = 0; added < limit && lists.some((l) => l.length > round); round++) {
    for (const l of lists) {
      if (added >= limit) break;
      if (l[round]) {
        jobs[l[round][0]] = l[round][1];
        added++;
      }
    }
  }

  const requests = Object.entries(jobs).map(([custom_id, job]) => {
    const { system, user } = contentPrompt(job);
    const { type, schema } = zodOutputFormat(contentSchema(job.skill));
    return {
      custom_id,
      params: {
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "low" as const, format: { type, schema } },
        system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
        messages: [{ role: "user" as const, content: user }],
      },
    };
  });
  if (!requests.length) return console.log("Üretilecek yeni konu yok.");

  const batch = await client.messages.batches.create({ requests });
  writeFileSync(jobsFile(batch.id), JSON.stringify(jobs, null, 1));
  console.log(`Batch gönderildi: ${batch.id} (${requests.length} içerik)`);
}

async function collect(id: string) {
  const jobs: Record<string, ContentJob> = JSON.parse(readFileSync(jobsFile(id), "utf8"));
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    const c = b.request_counts;
    console.log(`${new Date().toLocaleTimeString()} ${b.processing_status}: işleniyor ${c.processing}, başarılı ${c.succeeded}, hata ${c.errored}`);
    if (b.processing_status === "ended") break;
    await new Promise((r) => setTimeout(r, 60_000));
  }

  let saved = 0, skipped = 0, inTok = 0, outTok = 0;
  const failed: string[] = [];
  for await (const r of await client.messages.batches.results(id)) {
    const job = jobs[r.custom_id];
    if (!job) continue;
    if (r.result.type !== "succeeded") {
      failed.push(`${r.custom_id} ${job.topic}: ${r.result.type}`);
      continue;
    }
    const msg = r.result.message;
    inTok += msg.usage.input_tokens + (msg.usage.cache_creation_input_tokens ?? 0) + (msg.usage.cache_read_input_tokens ?? 0);
    outTok += msg.usage.output_tokens;
    const text = msg.content.find((b) => b.type === "text");
    if (msg.stop_reason !== "end_turn" || text?.type !== "text") {
      failed.push(`${r.custom_id} ${job.topic}: ${msg.stop_reason}`);
      continue;
    }
    try {
      const out = zodOutputFormat(contentSchema(job.skill)).parse(text.text);
      const missing = missingPart(job.skill, out.body);
      if (missing) throw new Error(`incomplete: no ${missing}`);
      const exists = await db.content.findFirst({ where: { skill: job.skill, level: job.level, topic: job.topic }, select: { id: true } });
      if (exists) {
        skipped++;
        continue;
      }
      await db.content.create({
        data: { skill: job.skill, level: job.level, topic: job.topic, title: out.title, body: sanitize(out.body) as object },
      });
      saved++;
    } catch (e) {
      failed.push(`${r.custom_id} ${job.topic}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  // Sonnet 5.5 batch fiyatı: girdi 1 $/M, çıktı 5 $/M (yaklaşık; önbellek indirimi hariç)
  const cost = (inTok * 1 + outTok * 5) / 1e6;
  console.log(`Kaydedilen ${saved}, zaten var ${skipped}, hatalı ${failed.length}`);
  console.log(`Token: girdi ${inTok}, çıktı ${outTok} → yaklaşık ${cost.toFixed(2)} $ (içerik başı ${(cost / Math.max(1, saved + failed.length)).toFixed(3)} $)`);
  if (failed.length) console.log(failed.join("\n"));
}

const [cmd, arg] = process.argv.slice(2);
(cmd === "submit" ? submit(arg ? Number(arg) : undefined) : cmd === "collect" && arg ? collect(arg) : Promise.reject(new Error("submit | collect <batchId>")))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
