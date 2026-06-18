import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      healthy: true,
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}
