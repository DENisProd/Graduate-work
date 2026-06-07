"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyModule = void 0;
const common_1 = require("@nestjs/common");
const gateway_config_1 = require("../config/gateway.config");
const proxy_service_1 = require("./proxy.service");
let ProxyModule = class ProxyModule {
};
exports.ProxyModule = ProxyModule;
exports.ProxyModule = ProxyModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: gateway_config_1.GATEWAY_CONFIG,
                useFactory: () => {
                    const { loadGatewayConfig } = require('../config/gateway.config');
                    return loadGatewayConfig();
                },
            },
            proxy_service_1.ProxyService,
        ],
        exports: [gateway_config_1.GATEWAY_CONFIG, proxy_service_1.ProxyService],
    })
], ProxyModule);
//# sourceMappingURL=proxy.module.js.map