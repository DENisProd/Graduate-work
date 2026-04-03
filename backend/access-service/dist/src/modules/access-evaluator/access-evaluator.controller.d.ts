import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';
import { AccessDecisionResponseDto } from './dto/access-decision-response.dto';
import { DeviceAccessCheckResponseDto } from './dto/device-access-check-response.dto';
export declare class AccessEvaluatorController {
    private readonly accessEvaluatorService;
    constructor(accessEvaluatorService: AccessEvaluatorService);
    check(dto: AccessCheckDto): Promise<AccessDecisionResponseDto>;
    checkByDevice(dto: AccessCheckByDeviceDto): Promise<DeviceAccessCheckResponseDto>;
}
