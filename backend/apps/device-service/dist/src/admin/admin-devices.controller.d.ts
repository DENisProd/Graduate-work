import { DevicesService } from '../devices/devices.service';
import { DeviceRequest } from '../devices/dto/device-request.dto';
import { DeviceResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
export declare class AdminDevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    findAll(page?: number, size?: number): Promise<PageResponse<DeviceResponse>>;
    findByCategoryId(categoryId: string, page?: number, size?: number): Promise<PageResponse<DeviceResponse>>;
    findByCode(code: string): Promise<DeviceResponse>;
    findById(id: string): Promise<DeviceResponse>;
    create(body: DeviceRequest): Promise<DeviceResponse>;
    update(id: string, body: DeviceRequest): Promise<DeviceResponse>;
    delete(id: string): Promise<void>;
}
