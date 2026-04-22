import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../users/users.service';
import { ResourceNotFoundException } from '../common/exceptions';
import { HouseRequestDto } from './dto/house-request.dto';
import { HouseUpdateRequestDto } from './dto/house-update-request.dto';
import { House, User, Prisma } from '@prisma/client';
import type { HouseRolesService } from '../house-roles/house-roles.service';

type HouseWithOwner = House & { owner: User };

function houseRolesServiceRef() {
  const { HouseRolesService } =
    require('../house-roles/house-roles.service') as typeof import('../house-roles/house-roles.service');
  return HouseRolesService;
}

@Injectable()
export class HousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    @Inject(forwardRef(houseRolesServiceRef))
    private readonly houseRolesService: HouseRolesService,
  ) {}

  async findById(id: string): Promise<HouseWithOwner> {
    const house = await this.prisma.house.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!house) {
      throw new ResourceNotFoundException('Дом', 'id', id);
    }
    return house as HouseWithOwner;
  }

  async findByOwnerId(ownerId: string, page: number, size: number, sort: string): Promise<{ content: HouseWithOwner[]; total: number }> {
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.HouseOrderByWithRelationInput;
    const where = {
      OR: [
        { owner: { externalUserId: ownerId } },
        { members: { some: { user: { externalUserId: ownerId } } } },
      ],
    };
    const [content, total] = await Promise.all([
      this.prisma.house.findMany({
        where,
        include: { owner: true },
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.house.count({ where }),
    ]);
    return { content: content as HouseWithOwner[], total };
  }

  async findAll(page: number, size: number, sort: string): Promise<{ content: HouseWithOwner[]; total: number }> {
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.HouseOrderByWithRelationInput;
    const [content, total] = await Promise.all([
      this.prisma.house.findMany({
        include: { owner: true },
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.house.count(),
    ]);
    return { content: content as HouseWithOwner[], total };
  }

  async create(dto: HouseRequestDto): Promise<HouseWithOwner> {
    const owner = await this.userService.findOrCreateByUserId(dto.ownerId);
    const house = await this.prisma.house.create({
      data: {
        name: dto.name,
        ownerId: owner.id,
        avatarUrl: dto.avatarUrl,
        address: dto.address,
      },
    });
    const ownerMember = await this.prisma.houseMember.create({
      data: {
        userId: owner.id,
        houseId: house.id,
      },
    });
    await this.houseRolesService.createDefaultRolesForHouse(house.id, ownerMember.id);
    return this.findById(house.id);
  }

  async update(id: string, dto: HouseUpdateRequestDto): Promise<HouseWithOwner> {
    await this.findById(id);
    await this.prisma.house.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        avatarUrl: dto.avatarUrl ?? undefined,
        address: dto.address ?? undefined,
        updatedAt: new Date(),
      },
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.house.delete({ where: { id } });
  }

  async isOwner(houseId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.house.count({
      where: { id: houseId, owner: { externalUserId: userId } },
    });
    return count > 0;
  }
}


