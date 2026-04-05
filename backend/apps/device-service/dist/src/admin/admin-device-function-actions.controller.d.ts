import { DeviceFunctionActionsService } from '../device-function-actions/device-function-actions.service';
import { DeviceFunctionActionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionActionRequest } from '../devices/dto/device-function-action-request.dto';
export declare class AdminDeviceFunctionActionsController {
    private readonly service;
    constructor(service: DeviceFunctionActionsService);
    findAllByFunctionId(functionId: string): Promise<DeviceFunctionActionResponse[]>;
    findByFunctionId(functionId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findAllByDeviceId(deviceId: string): Promise<DeviceFunctionActionResponse[]>;
    findByDeviceId(deviceId: string, page?: number, size?: number): Promise<PageResponse<DeviceFunctionActionResponse>>;
    findById(id: string): Promise<DeviceFunctionActionResponse>;
    create(body: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse>;
    update(id: string, body: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse>;
    delete(id: string): Promise<void>;
}
