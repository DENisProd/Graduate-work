import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceNotFoundException } from '../modules/common/exceptions';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByUserId(userId: string): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: { externalUserId: userId },
    });
    if (existing) return existing;
    return this.prisma.user.create({
      data: { externalUserId: userId },
    });
  }

  async findByUserId(userId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { externalUserId: userId },
    });
    if (!user) {
      throw new ResourceNotFoundException('Пользователь', 'userId', userId);
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new ResourceNotFoundException('Пользователь', 'id', id);
    }
    return user;
  }

  /** Обновляет или создаёт пользователя с отображаемым именем (идемпотентно по externalUserId). */
  async upsertDisplayName(externalUserId: string, displayName: string): Promise<void> {
    const trimmed = displayName.trim().slice(0, 255);
    if (!trimmed) return;
    await this.prisma.user.upsert({
      where: { externalUserId },
      create: { externalUserId, displayName: trimmed },
      update: { displayName: trimmed },
    });
  }
}

