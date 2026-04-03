import { PrismaService } from '../prisma/prisma.service';
import { DeviceTypeRequest } from '../devices/dto/device-type-request.dto';
import { DeviceTypeResponse } from '../devices/dto/device-response.dto';
export declare class DeviceTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toResponse;
    findAll(): Promise<DeviceTypeResponse[]>;
    findById(id: number): Promise<DeviceTypeResponse>;
    findByCode(code: string): Promise<DeviceTypeResponse>;
    findAllFull(): Promise<DeviceTypeResponse[]>;
    findByIdFull(id: number): Promise<DeviceTypeResponse>;
    findByCodeFull(code: string): Promise<DeviceTypeResponse>;
    create(request: DeviceTypeRequest): Promise<DeviceTypeResponse>;
    update(id: number, request: DeviceTypeRequest): Promise<DeviceTypeResponse>;
    delete(id: number): Promise<void>;
    private ensureExists;
}
