import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("prisma+")) {
    return new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
