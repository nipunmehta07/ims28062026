import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getSafePrismaClient = () => {
  const baseDbUrl = process.env.POSTGRES_PRISMA_URL || "";
  
  if (!baseDbUrl) {
    throw new Error("POSTGRES_PRISMA_URL is not defined in .env");
  }

  // Use URL object to safely append timeouts without string-mashing errors
  try {
    const url = new URL(baseDbUrl);
   // Ensure this logic is still in your src/lib/prisma.ts
url.searchParams.set('connect_timeout', '60'); // Increased to 60s for stability
url.searchParams.set('pool_timeout', '60');

    return new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: url.toString(),
        },
      },
    });
  } catch (e) {
    // If URL parsing fails, fall back to raw URL to avoid crashing build
    return new PrismaClient();
  }
};

export const prisma = globalForPrisma.prisma || getSafePrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
