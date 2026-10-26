// Öğretmenin materyal klasöründeki PDF'lerden kelime/deyim/konu listelerini çıkarır
// ve prisma/data/materials.json'a yazar. Kullanım:
//   npm run materials:import -- /home/yagshy/Desktop/oxford
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { extractList } from "../src/lib/ai";

const dir = process.argv[2] ?? "/home/yagshy/Desktop/oxford";
const Lvl = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

function pdf(name: string, maxWords = 12000) {
  const text = execFileSync("pdftotext", ["-layout", path.join(dir, name), "-"], { maxBuffer: 64 * 1024 * 1024 }).toString();
  return text.split(/\s+/).slice(0, maxWords).join(" ");
}

async function main() {
  const [irregular, verbs, idioms, everyday, effortless] = await Promise.all([
    extractList(
      "List every irregular English verb in this material with its past simple and past participle (use the most common form when several are given). Assign each the CEFR level at which learners usually meet it.",
      pdf("list-of-irregular-verbs.pdf") + "\n\n" + pdf("Irregular Verb List – Gallaudet University.pdf"),
      z.object({ verbs: z.array(z.object({ base: z.string(), past: z.string(), participle: z.string(), level: Lvl })) }),
    ),
    extractList(
      "List the distinct English base verbs that appear in this verb list (ignore navigation text and example sentences). Assign each the CEFR level at which learners usually meet it.",
      pdf("1000+ Most Common English Verbs List with Useful Examples • 7ESL.pdf"),
      z.object({ verbs: z.array(z.object({ word: z.string(), level: Lvl })) }),
    ),
    extractList(
      "List every idiom taught in this book (from the table of contents and headings). Assign each the CEFR level (B2, C1 or C2) at which a learner could use it.",
      pdf("101 American English Idioms_ Understanding and Speaking English Like an American ( PDFDrive ).pdf", 3000),
      z.object({ idioms: z.array(z.object({ idiom: z.string(), level: Lvl })) }),
    ),
    extractList(
      "List the everyday-life topics or chapter themes this book covers, as short English topic names suitable for a reading or speaking lesson. Assign each the CEFR level (A2, B1 or B2) it suits.",
      pdf("Improve Your English_ English in Everyday Life ( PDFDrive ).pdf", 4000),
      z.object({ topics: z.array(z.object({ topic: z.string(), level: Lvl })) }),
    ),
    extractList(
      "List the main topics or chapter themes of this book as short English topic names suitable for a speaking or listening lesson. Assign each the CEFR level (B1, B2 or C1) it suits.",
      pdf("Effortless English_ Learn To Speak English Like A Native ( PDFDrive ).pdf", 4000),
      z.object({ topics: z.array(z.object({ topic: z.string(), level: Lvl })) }),
    ),
  ]);

  const out = {
    source: dir,
    irregularVerbs: irregular.verbs,
    verbs: verbs.verbs,
    idioms: idioms.idioms,
    topics: [...everyday.topics, ...effortless.topics],
  };
  mkdirSync("prisma/data", { recursive: true });
  writeFileSync("prisma/data/materials.json", JSON.stringify(out, null, 2));
  console.log(
    `irregular verbs: ${out.irregularVerbs.length}, verbs: ${out.verbs.length}, idioms: ${out.idioms.length}, topics: ${out.topics.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
