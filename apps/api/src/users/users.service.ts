import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findActiveById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, is_active: true },
      select: safeUserSelect,
    });

    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async list() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { created_at: "desc" },
    });
  }

  async create(input: { name: string; email: string; password: string; role: UserRole }) {
    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: input.role,
      },
      select: safeUserSelect,
    });
  }
}
