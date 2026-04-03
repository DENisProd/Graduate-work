import { DeviceTypesService } from './device-types.service';
import { DeviceTypeResponse } from '../devices/dto/device-response.dto';
export declare class DeviceTypesController {
    private readonly deviceTypesService;
    constructor(deviceTypesService: DeviceTypesService);
    findAll(): Promise<DeviceTypeResponse[]>;
    findByCode(code: string): Promise<DeviceTypeResponse>;
    findById(id: string): Promise<DeviceTypeResponse>;
}
