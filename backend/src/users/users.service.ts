import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (user) {
      const { password, ...rest } = user as any;
      return rest;
    }
    return null;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { role: { select: { name: true, code: true } } },
    });
    return users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
  }
}
