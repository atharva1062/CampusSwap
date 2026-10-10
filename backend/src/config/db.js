const { PrismaClient } = require('@prisma/client');


let prisma;

try {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient({
      log: ['error'],
    });
  }
  prisma = globalThis.prisma;
} catch (err) {
  console.error('Failed to initialize PrismaClient:', err.message);
  try {
    prisma = new PrismaClient();
  } catch (e) {
    prisma = {};
  }
}

module.exports = prisma;
