// tr/tk alanlarına karışmış Kiril harfleri veritabanındaki tüm içeriklerde düzeltir: npx tsx scripts/fix-latin.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fixLatinFields } from "../src/lib/ai";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  let fixed = 0;
  for (const c of await db.content.findMany({ select: { id: true, body: true } })) {
    const next = fixLatinFields(c.body);
    if (JSON.stringify(next) !== JSON.stringify(c.body)) {
      await db.content.update({ where: { id: c.id }, data: { body: next as object } });
      fixed++;
    }
  }
  console.log(`Düzeltilen içerik: ${fixed}`);
}
main().finally(() => db.$disconnect());
