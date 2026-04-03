import { PrismaService } from '../prisma/prisma.service';
import { DeviceStatus } from './device-status.enum';
import { DeviceRequest } from './dto/device-request.dto';
import { DeviceResponse } from './dto/device-response.dto';
import { PageResponse } from './dto/page-response.dto';
export declare class DevicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDeviceResponse;
    findAll(page: number, size: number): Promise<PageResponse<DeviceResponse>>;
    findByCategoryId(categoryId: number, page: number, size: number): Promise<PageResponse<DeviceResponse>>;
    findById(id: number): Promise<DeviceResponse>;
    findByIdDetailed(id: number): Promise<DeviceResponse>;
    findByCode(code: string): Promise<DeviceResponse>;
    create(request: DeviceRequest): Promise<DeviceResponse>;
    update(id: number, request: DeviceRequest): Promise<DeviceResponse>;
    updateStatus(id: number, status: DeviceStatus): Promise<DeviceResponse>;
    delete(id: number): Promise<void>;
    private ensureExists;
}
