import { PrismaService } from '../prisma/prisma.service';
import { DeviceFunctionActionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionActionRequest } from '../devices/dto/device-function-action-request.dto';
export declare class DeviceFunctionActionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toResponse;
    findByFunctionId(functionId: number): Promise<DeviceFunctionActionResponse[]>;
    findByFunctionIdPaged(functionId: number, page: number, size: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findByDeviceId(deviceId: number): Promise<DeviceFunctionActionResponse[]>;
    findByDeviceIdPaged(deviceId: number, page: number, size: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findById(id: number): Promise<DeviceFunctionActionResponse>;
    execute(id: number): Promise<DeviceFunctionActionResponse>;
    findByFunctionIdFull(functionId: number, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse> | DeviceFunctionActionResponse[]>;
    findByDeviceIdFull(deviceId: number, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse> | DeviceFunctionActionResponse[]>;
    findByIdFull(id: number): Promise<DeviceFunctionActionResponse>;
    create(request: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse>;
    update(id: number, request: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse>;
    delete(id: number): Promise<void>;
    private ensureExists;
}
