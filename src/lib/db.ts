import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Geliştirmede hot reload her seferinde yeni bağlantı havuzu açmasın.
// Önbellek, PrismaClient sınıfına bağlı: `prisma generate` sonrası yeni sınıf gelince eski istemci kullanılmaz.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaClass?: unknown };

function create() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

export const db =
  globalForPrisma.prisma && globalForPrisma.prismaClass === PrismaClient ? globalForPrisma.prisma : create();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaClass = PrismaClient;
}
