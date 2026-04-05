import { DeviceFunctionsService } from '../device-functions/device-functions.service';
import { DeviceFunctionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionRequest } from '../devices/dto/device-function-request.dto';
export declare class AdminDeviceFunctionsController {
    private readonly service;
    constructor(service: DeviceFunctionsService);
    findAllByDeviceId(deviceId: string): Promise<DeviceFunctionResponse[]>;
    findByDeviceId(deviceId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionResponse>>;
    findById(id: string): Promise<DeviceFunctionResponse>;
    create(body: DeviceFunctionRequest): Promise<DeviceFunctionResponse>;
    update(id: string, body: DeviceFunctionRequest): Promise<DeviceFunctionResponse>;
    delete(id: string): Promise<void>;
}
