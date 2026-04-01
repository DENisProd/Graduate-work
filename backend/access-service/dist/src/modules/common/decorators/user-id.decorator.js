"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const common_1 = require("@nestjs/common");
exports.UserId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const raw = req.headers['x-user-id'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const userId = value ? String(value).trim() : '';
    if (!userId) {
        throw new common_1.UnauthorizedException('Требуется заголовок X-User-Id с идентификатором пользователя');
    }
    return userId;
});
