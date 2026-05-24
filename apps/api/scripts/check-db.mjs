import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  const users = await prisma.user.count();
  console.log(`OK — database reachable (${users} users in seed table).`);
  process.exit(0);
} catch (error) {
  console.error("Database check failed:");
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "\nTips:\n" +
      "• Neon: open console.neon.tech and resume/wake the project, then copy a fresh pooled connection string.\n" +
      "• Use sslmode=require only (remove channel_binding=require from DATABASE_URL).\n" +
      "• Local: set DATABASE_URL to postgres://postgres:postgres@localhost:5432/fleetnexus?schema=public\n",
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
