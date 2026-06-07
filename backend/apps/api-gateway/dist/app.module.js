"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_middleware_1 = require("./auth/auth.middleware");
const proxy_middleware_1 = require("./proxy/proxy.middleware");
const proxy_module_1 = require("./proxy/proxy.module");
const health_controller_1 = require("./health/health.controller");
const logging_interceptor_1 = require("./interceptors/logging.interceptor");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(auth_middleware_1.AuthMiddleware, proxy_middleware_1.ProxyMiddleware)
            // /health is served by HealthController, not proxied
            .exclude({ path: 'health', method: common_1.RequestMethod.GET })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [proxy_module_1.ProxyModule],
        controllers: [health_controller_1.HealthController],
        providers: [
            auth_middleware_1.AuthMiddleware,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map