import { ZigbeeService } from './zigbee.service';
export declare class ZigbeeIngestService {
    private readonly zigbee;
    private readonly logger;
    constructor(zigbee: ZigbeeService);
    processMqttMessage(topicBase: string, topic: string, payload: Buffer): Promise<void>;
    private onBridgeDevices;
    private onBridgeEvent;
    private onBridgeState;
    private onBridgeInfo;
    private onBridgeHealth;
    private onBridgeResponse;
    private onDeviceTelemetry;
}
