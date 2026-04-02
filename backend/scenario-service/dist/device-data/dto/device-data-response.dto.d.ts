import { DeviceDataType } from '../../common/schemas/enums';
export declare class DeviceDataResponseDto {
    id: string;
    deviceId: string;
    capability: string;
    attribute?: string | null;
    type: DeviceDataType;
    value: unknown;
    unit?: string | null;
    quality?: number | null;
    timestamp: Date;
}
export declare class DeviceDataListResponseDto {
    items: DeviceDataResponseDto[];
    total: number;
}
