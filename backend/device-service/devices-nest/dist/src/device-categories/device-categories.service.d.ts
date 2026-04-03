import { PrismaService } from '../prisma/prisma.service';
import { DeviceCategoryResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceCategoryRequest } from '../devices/dto/device-category-request.dto';
export declare class DeviceCategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDeviceType;
    private toResponse;
    findAll(page: number, size: number): Promise<PageResponse<DeviceCategoryResponse>>;
    findAllList(): Promise<DeviceCategoryResponse[]>;
    findByDeviceTypeId(deviceTypeId: number): Promise<DeviceCategoryResponse[]>;
    findById(id: number): Promise<DeviceCategoryResponse>;
    findByCode(code: string): Promise<DeviceCategoryResponse>;
    findByDeviceTypeIdFull(deviceTypeId: number): Promise<DeviceCategoryResponse[]>;
    findAllFull(page?: number, size?: number): Promise<any>;
    findByIdFull(id: number): Promise<DeviceCategoryResponse>;
    findByCodeFull(code: string): Promise<DeviceCategoryResponse>;
    create(request: DeviceCategoryRequest): Promise<DeviceCategoryResponse>;
    update(id: number, request: DeviceCategoryRequest): Promise<DeviceCategoryResponse>;
    delete(id: number): Promise<void>;
    private ensureExists;
}
