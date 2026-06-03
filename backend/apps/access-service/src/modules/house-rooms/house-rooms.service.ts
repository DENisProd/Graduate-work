import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { ResourceNotFoundException } from '../common/exceptions';
import { HouseRoomRequestDto } from './dto/house-room-request.dto';
import { Resource, House, ResourceType } from '@prisma/client';

type RoomWithHouse = Resource & { house: House };

@Injectable()
export class HouseRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly housesService: HousesService,
  ) {}

  async findById(id: string): Promise<RoomWithHouse> {
    const room = await this.prisma.resource.findUnique({
      where: { id },
      include: { house: true },
    });
    if (!room || room.type !== ResourceType.ROOM) {
      throw new ResourceNotFoundException('Комната', 'id', id);
    }
    return room as RoomWithHouse;
  }

  async findByHouseId(houseId: string): Promise<RoomWithHouse[]> {
    await this.housesService.findById(houseId);
    const rooms = await this.prisma.resource.findMany({
      where: { houseId, type: ResourceType.ROOM },
      include: { house: true },
      orderBy: { createdAt: 'asc' },
    });
    return rooms as RoomWithHouse[];
  }

  async create(dto: HouseRoomRequestDto): Promise<RoomWithHouse> {
    await this.housesService.findById(dto.houseId);

    let parentResource = await this.prisma.resource.findFirst({
      where: { houseId: dto.houseId, type: ResourceType.HOUSE },
    });
    if (!parentResource) {
      parentResource = await this.prisma.resource.create({
        data: {
          houseId: dto.houseId,
          type: ResourceType.HOUSE,
          path: `/${dto.houseId}`,
          depth: 0,
        },
      });
    }

    const room = await this.prisma.resource.create({
      data: {
        houseId: dto.houseId,
        type: ResourceType.ROOM,
        name: dto.name,
        parentId: parentResource.id,
        path: parentResource.path,
        depth: parentResource.depth + 1,
      },
    });

    await this.prisma.resource.update({
      where: { id: room.id },
      data: { path: `${parentResource.path}/${room.id}` },
    });

    return this.findById(room.id);
  }

  async update(id: string, dto: HouseRoomRequestDto): Promise<RoomWithHouse> {
    await this.findById(id);
    await this.prisma.resource.update({
      where: { id },
      data: { name: dto.name },
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.resource.delete({ where: { id } });
  }

  async existsInHouse(roomId: string, houseId: string): Promise<boolean> {
    const count = await this.prisma.resource.count({
      where: { id: roomId, houseId, type: ResourceType.ROOM },
    });
    return count > 0;
  }
}

