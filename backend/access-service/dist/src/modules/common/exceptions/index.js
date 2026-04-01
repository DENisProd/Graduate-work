"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateResourceException = exports.ForbiddenException = exports.BadRequestException = exports.ResourceNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class ResourceNotFoundException extends common_1.HttpException {
    constructor(resourceName, fieldName, fieldValue) {
        super(`${resourceName} не найден с ${fieldName}: '${fieldValue}'`, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
class BadRequestException extends common_1.HttpException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BadRequestException = BadRequestException;
class ForbiddenException extends common_1.HttpException {
    constructor(message) {
        super(message, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenException = ForbiddenException;
class DuplicateResourceException extends common_1.HttpException {
    constructor(resourceName, fieldName, fieldValue) {
        super(`${resourceName} уже существует с ${fieldName}: '${fieldValue}'`, common_1.HttpStatus.CONFLICT);
    }
}
exports.DuplicateResourceException = DuplicateResourceException;
