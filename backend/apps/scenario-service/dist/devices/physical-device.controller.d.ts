import { PhysicalDeviceService } from './physical-device.service';
import { CreatePhysicalDeviceDto } from './dto/create-physical-device.dto';
import { UpdatePhysicalDeviceDto } from './dto/update-physical-device.dto';
export declare class PhysicalDeviceController {
    private readonly service;
    constructor(service: PhysicalDeviceService);
    create(dto: CreatePhysicalDeviceDto): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    findMany(query: unknown): Promise<{
        items: (import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
            id: string;
        })[];
        total: number;
    }>;
    findOne(params: unknown): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    update(params: unknown, dto: UpdatePhysicalDeviceDto): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
    remove(params: unknown): Promise<import("../mongo/schemas/physical-device.mongo").PhysicalDeviceModel & {
        id: string;
    }>;
}
