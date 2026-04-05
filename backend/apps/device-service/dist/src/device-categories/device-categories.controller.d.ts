import { DeviceCategoriesService } from './device-categories.service';
import { DeviceCategoryResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
export declare class DeviceCategoriesController {
    private readonly service;
    constructor(service: DeviceCategoriesService);
    findAll(page?: number, size?: number): Promise<PageResponse<DeviceCategoryResponse>>;
    findAllList(): Promise<DeviceCategoryResponse[]>;
    findByDeviceTypeId(deviceTypeId: string): Promise<DeviceCategoryResponse[]>;
    findByCode(code: string): Promise<DeviceCategoryResponse>;
    findById(id: string): Promise<DeviceCategoryResponse>;
}
