import { DevicesService } from './devices.service';
import { DeviceStatus } from './device-status.enum';
import { DeviceRequest } from './dto/device-request.dto';
import { DeviceResponse } from './dto/device-response.dto';
import { PageResponse } from './dto/page-response.dto';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    findAll(page?: number, size?: number): Promise<PageResponse<DeviceResponse>>;
    findByCategoryId(categoryId: string, page?: number, size?: number): Promise<PageResponse<DeviceResponse>>;
    findByIdDetailed(id: string): Promise<DeviceResponse>;
    findByCode(code: string): Promise<DeviceResponse>;
    findById(id: string): Promise<DeviceResponse>;
    updateStatus(id: string, status: DeviceStatus): Promise<DeviceResponse>;
    create(body: DeviceRequest): Promise<DeviceResponse>;
    update(id: string, body: DeviceRequest): Promise<DeviceResponse>;
    softDelete(id: string): Promise<void>;
}
