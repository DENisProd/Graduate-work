export declare enum ScenarioStatus {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
    ERROR = "ERROR"
}
export declare const scenarioStatusSchema: any;
export declare enum TriggerSourceType {
    SCHEDULE = "SCHEDULE",
    MANUAL = "MANUAL",
    AUTOMATIC = "AUTOMATIC",
    SYSTEM = "SYSTEM",
    API = "API"
}
export declare const triggerSourceTypeSchema: any;
export declare enum ScenarioExecutionStatus {
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    FAILURE = "FAILURE"
}
export declare const scenarioExecutionStatusSchema: any;
export declare enum DeviceDataType {
    FLOAT = "FLOAT",
    NUMBER = "NUMBER",
    STRING = "STRING",
    BOOLEAN = "BOOLEAN"
}
export declare const deviceDataTypeSchema: any;
