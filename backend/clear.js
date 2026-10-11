const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clear() {
  await prisma.savedItem.deleteMany();
  await prisma.message.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.listing.deleteMany();
  console.log('All listings and related data cleared successfully!');
}
clear().catch(console.error).finally(() => prisma.$disconnect());
