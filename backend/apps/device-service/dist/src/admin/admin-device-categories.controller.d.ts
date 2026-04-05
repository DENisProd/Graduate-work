import { DeviceCategoriesService } from '../device-categories/device-categories.service';
import { DeviceCategoryResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceCategoryRequest } from '../devices/dto/device-category-request.dto';
export declare class AdminDeviceCategoriesController {
    private readonly service;
    constructor(service: DeviceCategoriesService);
    findAll(page?: number, size?: number): Promise<PageResponse<DeviceCategoryResponse>>;
    findAllList(): Promise<DeviceCategoryResponse[]>;
    findByDeviceTypeId(deviceTypeId: string): Promise<DeviceCategoryResponse[]>;
    findByCode(code: string): Promise<DeviceCategoryResponse>;
    findById(id: string): Promise<DeviceCategoryResponse>;
    create(body: DeviceCategoryRequest): Promise<DeviceCategoryResponse>;
    update(id: string, body: DeviceCategoryRequest): Promise<DeviceCategoryResponse>;
    delete(id: string): Promise<void>;
}
