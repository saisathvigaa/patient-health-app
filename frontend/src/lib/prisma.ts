import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - datasourceUrl is valid in Prisma 7 runtime but not yet in TS types
  return new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
    .$extends(withAccelerate()) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
