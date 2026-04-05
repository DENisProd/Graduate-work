import { PrismaService } from '../prisma/prisma.service';
import { DeviceFunctionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionRequest } from '../devices/dto/device-function-request.dto';
export declare class DeviceFunctionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toResponse;
    findByDeviceId(deviceId: number): Promise<DeviceFunctionResponse[]>;
    findByDeviceIdPaged(deviceId: number, page: number, size: number): Promise<PageResponse<DeviceFunctionResponse>>;
    findWritableFunctions(deviceId: number): Promise<DeviceFunctionResponse[]>;
    findById(id: number): Promise<DeviceFunctionResponse>;
    findByIdDetailed(id: number): Promise<DeviceFunctionResponse>;
    updateValue(id: number, value: string): Promise<DeviceFunctionResponse>;
    findByDeviceIdFull(deviceId: number): Promise<DeviceFunctionResponse[]>;
    findByDeviceIdFullPaged(deviceId: number, page: number, size: number): Promise<PageResponse<DeviceFunctionResponse>>;
    findByIdFull(id: number): Promise<DeviceFunctionResponse>;
    create(request: DeviceFunctionRequest): Promise<DeviceFunctionResponse>;
    update(id: number, request: DeviceFunctionRequest): Promise<DeviceFunctionResponse>;
    delete(id: number): Promise<void>;
    private ensureExists;
}
