const { PrismaClient } = require('@prisma/client');

// Ensure DATABASE_URL environment variable has a valid fallback to prevent serverless initialization crash
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/campusswap?schema=public";
}

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
