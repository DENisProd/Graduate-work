"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Внутренняя ошибка сервера';
        let fieldErrors;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'object' && res !== null) {
                const obj = res;
                message = obj.message || exception.message;
                if (Array.isArray(obj.message)) {
                    const arr = obj.message;
                    fieldErrors = arr.map((m) => ({
                        field: '',
                        message: m,
                        rejectedValue: undefined,
                    }));
                    message = 'Ошибка валидации';
                }
            }
            else {
                message = String(res);
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            if (exception.name === 'NotFoundError') {
                status = common_1.HttpStatus.NOT_FOUND;
            }
        }
        const errorBody = {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            status,
            error: common_1.HttpStatus[status] || 'Error',
            message,
            path: request.url,
            ...(fieldErrors && fieldErrors.length > 0 ? { fieldErrors } : {}),
        };
        this.logger.warn(`${request.method} ${request.url} ${status} - ${message}`);
        response.status(status).json(errorBody);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
