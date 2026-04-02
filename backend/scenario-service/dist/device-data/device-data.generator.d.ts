import { PhysicalDeviceService } from '../devices/physical-device.service';
import { DeviceDataService } from './device-data.service';
export declare class DeviceDataGeneratorService {
    private readonly deviceDataService;
    private readonly physicalDeviceService;
    private readonly logger;
    constructor(deviceDataService: DeviceDataService, physicalDeviceService: PhysicalDeviceService);
    generateRandomDataForDevices(): Promise<void>;
    private getAllDevices;
    private buildRandomPayload;
    private randomFloat;
    private randomInt;
}
