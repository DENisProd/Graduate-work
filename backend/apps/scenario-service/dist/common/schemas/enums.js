"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceDataTypeSchema = exports.DeviceDataType = exports.scenarioExecutionStatusSchema = exports.ScenarioExecutionStatus = exports.triggerSourceTypeSchema = exports.TriggerSourceType = exports.scenarioStatusSchema = exports.ScenarioStatus = void 0;
const zod_1 = require("zod");
var ScenarioStatus;
(function (ScenarioStatus) {
    ScenarioStatus["OFFLINE"] = "OFFLINE";
    ScenarioStatus["ONLINE"] = "ONLINE";
    ScenarioStatus["ERROR"] = "ERROR";
})(ScenarioStatus || (exports.ScenarioStatus = ScenarioStatus = {}));
exports.scenarioStatusSchema = zod_1.z.nativeEnum(ScenarioStatus);
var TriggerSourceType;
(function (TriggerSourceType) {
    TriggerSourceType["SCHEDULE"] = "SCHEDULE";
    TriggerSourceType["MANUAL"] = "MANUAL";
    TriggerSourceType["AUTOMATIC"] = "AUTOMATIC";
    TriggerSourceType["SYSTEM"] = "SYSTEM";
    TriggerSourceType["API"] = "API";
})(TriggerSourceType || (exports.TriggerSourceType = TriggerSourceType = {}));
exports.triggerSourceTypeSchema = zod_1.z.nativeEnum(TriggerSourceType);
var ScenarioExecutionStatus;
(function (ScenarioExecutionStatus) {
    ScenarioExecutionStatus["RUNNING"] = "RUNNING";
    ScenarioExecutionStatus["SUCCESS"] = "SUCCESS";
    ScenarioExecutionStatus["FAILURE"] = "FAILURE";
})(ScenarioExecutionStatus || (exports.ScenarioExecutionStatus = ScenarioExecutionStatus = {}));
exports.scenarioExecutionStatusSchema = zod_1.z.nativeEnum(ScenarioExecutionStatus);
var DeviceDataType;
(function (DeviceDataType) {
    DeviceDataType["FLOAT"] = "FLOAT";
    DeviceDataType["NUMBER"] = "NUMBER";
    DeviceDataType["STRING"] = "STRING";
    DeviceDataType["BOOLEAN"] = "BOOLEAN";
})(DeviceDataType || (exports.DeviceDataType = DeviceDataType = {}));
exports.deviceDataTypeSchema = zod_1.z.nativeEnum(DeviceDataType);
//# sourceMappingURL=enums.js.map