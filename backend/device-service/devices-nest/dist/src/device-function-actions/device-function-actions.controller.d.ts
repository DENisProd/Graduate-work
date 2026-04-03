import { DeviceFunctionActionsService } from './device-function-actions.service';
import { DeviceFunctionActionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
export declare class DeviceFunctionActionsController {
    private readonly service;
    constructor(service: DeviceFunctionActionsService);
    findAllByFunctionId(functionId: string): Promise<DeviceFunctionActionResponse[]>;
    findByFunctionId(functionId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findAllByDeviceId(deviceId: string): Promise<DeviceFunctionActionResponse[]>;
    findByDeviceId(deviceId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findById(id: string): Promise<DeviceFunctionActionResponse>;
    execute(id: string): Promise<DeviceFunctionActionResponse>;
}
