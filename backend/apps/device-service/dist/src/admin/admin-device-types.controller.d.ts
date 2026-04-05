import { DeviceTypesService } from '../device-types/device-types.service';
import { DeviceTypeResponse } from '../devices/dto/device-response.dto';
import { DeviceTypeRequest } from '../devices/dto/device-type-request.dto';
export declare class AdminDeviceTypesController {
    private readonly service;
    constructor(service: DeviceTypesService);
    findAll(): Promise<DeviceTypeResponse[]>;
    findByCode(code: string): Promise<DeviceTypeResponse>;
    findById(id: string): Promise<DeviceTypeResponse>;
    create(body: DeviceTypeRequest): Promise<DeviceTypeResponse>;
    update(id: string, body: DeviceTypeRequest): Promise<DeviceTypeResponse>;
    delete(id: string): Promise<void>;
}
