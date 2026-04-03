import { DeviceFunctionsService } from './device-functions.service';
import { DeviceFunctionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
export declare class DeviceFunctionsController {
    private readonly service;
    constructor(service: DeviceFunctionsService);
    findAllByDeviceId(deviceId: string): Promise<DeviceFunctionResponse[]>;
    findWritableFunctions(deviceId: string): Promise<DeviceFunctionResponse[]>;
    findByDeviceId(deviceId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionResponse>>;
    findByIdDetailed(id: string): Promise<DeviceFunctionResponse>;
    findById(id: string): Promise<DeviceFunctionResponse>;
    updateValue(id: string, value: string): Promise<DeviceFunctionResponse>;
}
