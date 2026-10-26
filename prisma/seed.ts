// İlk öğretmen hesabını oluşturur: npm run db:seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const username = (process.env.TEACHER_USERNAME ?? "ogretmen").toLowerCase();
  const password = process.env.TEACHER_PASSWORD;
  if (!password || password === "degistir-beni") {
    throw new Error(".env içinde TEACHER_PASSWORD'u değiştir.");
  }
  const teacher = await db.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      name: process.env.TEACHER_NAME ?? "Öğretmen",
      role: "TEACHER",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`Öğretmen hazır: ${teacher.username}`);
}

main().finally(() => db.$disconnect());
