const { PrismaClient } = require('@prisma/client');

let prisma;

try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
      log: ['error'],
    });
  } else {
    if (!globalThis.prisma) {
      globalThis.prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    prisma = globalThis.prisma;
  }
} catch (err) {
  console.error('Failed to initialize PrismaClient:', err.message);
  prisma = new PrismaClient();
}

module.exports = prisma;
