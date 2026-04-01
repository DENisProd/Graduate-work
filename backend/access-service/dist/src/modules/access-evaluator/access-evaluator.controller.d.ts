import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';
export declare class AccessEvaluatorController {
    private readonly accessEvaluatorService;
    constructor(accessEvaluatorService: AccessEvaluatorService);
    check(dto: AccessCheckDto): Promise<{
        allowed: boolean;
        source: "EFFECTIVE" | "ACCESS_RIGHT" | "POLICY" | "NONE";
        rightType?: import("@prisma/client").AccessRightType;
    }>;
    checkByDevice(dto: AccessCheckByDeviceDto): Promise<{
        allow: boolean;
        deny: boolean;
    }>;
}
