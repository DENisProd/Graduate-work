"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeRealtimeService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let ZigbeeRealtimeService = class ZigbeeRealtimeService {
    stateSubject = new rxjs_1.Subject();
    stateUpdates$ = this.stateSubject.asObservable();
    publishStateUpdate(state, meta) {
        this.stateSubject.next({
            deviceIeeeAddr: state.deviceIeeeAddr,
            physicalDeviceId: meta.physicalDeviceId ?? null,
            friendlyName: meta.friendlyName ?? null,
            timestamp: state.timestamp,
            metrics: {
                state: state.state ?? null,
                brightness: state.brightness ?? null,
                linkquality: state.linkquality ?? null,
                colorMode: state.colorMode ?? null,
                occupancy: state.occupancy ?? null,
                temperature: state.temperature ?? null,
                humidity: state.humidity ?? null,
                battery: state.battery ?? null,
            },
            payload: meta.payload,
            stateId: state.id,
        });
    }
};
exports.ZigbeeRealtimeService = ZigbeeRealtimeService;
exports.ZigbeeRealtimeService = ZigbeeRealtimeService = __decorate([
    (0, common_1.Injectable)()
], ZigbeeRealtimeService);
//# sourceMappingURL=zigbee-realtime.service.js.map