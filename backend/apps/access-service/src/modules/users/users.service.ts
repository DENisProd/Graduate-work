import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceNotFoundException } from '../common/exceptions';
import { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByExternalUserId(externalUserId: string, avatarUrl?: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { externalUserId },
    });
    if (existing) {
      if (avatarUrl !== undefined) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { avatarUrl },
        });
      }
      return existing;
    }
    try {
      return await this.prisma.user.create({
        data: { externalUserId, avatarUrl: avatarUrl ?? null },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const user = await this.prisma.user.findUnique({ where: { externalUserId } });
        if (user && avatarUrl !== undefined) {
          return this.prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
          });
        }
        if (user) return user;
      }
      throw e;
    }
  }

  async findByExternalUserId(externalUserId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { externalUserId },
    });
    if (!user) {
      throw new ResourceNotFoundException('Пользователь', 'externalUserId', externalUserId);
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
}

