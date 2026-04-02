import type { Model } from 'mongoose';
import type { CreatePhysicalDeviceInput, UpdatePhysicalDeviceInput } from './schemas/physical-device.schema';
import { PhysicalDeviceModel } from '../mongo/schemas/physical-device.mongo';
type PhysicalDevice = PhysicalDeviceModel & {
    id: string;
};
export declare class PhysicalDeviceRepository {
    private readonly model;
    constructor(model: Model<PhysicalDeviceModel>);
    private map;
    create(data: CreatePhysicalDeviceInput): Promise<PhysicalDevice>;
    findById(id: string): Promise<PhysicalDevice | null>;
    findMany(params: {
        houseId?: string;
        roomId?: string;
        page: number;
        limit: number;
    }): Promise<{
        items: PhysicalDevice[];
        total: number;
    }>;
    update(id: string, data: UpdatePhysicalDeviceInput): Promise<PhysicalDevice>;
    delete(id: string): Promise<PhysicalDevice>;
}
export {};
