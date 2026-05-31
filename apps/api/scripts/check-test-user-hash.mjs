import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const emails = ["test-admin@fleetnexus.test", "agent1@bookmycarz.com"];

for (const email of emails) {
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(email, "exists:", Boolean(user), "hash:", user?.password_hash?.slice(0, 29));
  if (user?.password_hash) {
    try {
      const ok = await bcrypt.compare(
        email.includes("admin") ? "Admin@123" : "Agent@123",
        user.password_hash,
      );
      console.log("  compare:", ok);
    } catch (e) {
      console.log("  compare error:", e.message);
    }
  }
}

await prisma.$disconnect();
