import { HttpException } from '@nestjs/common';
export declare class ResourceNotFoundException extends HttpException {
    constructor(resourceName: string, fieldName: string, fieldValue: unknown);
}
export declare class BadRequestException extends HttpException {
    constructor(message: string);
}
export declare class ForbiddenException extends HttpException {
    constructor(message: string);
}
export declare class DuplicateResourceException extends HttpException {
    constructor(resourceName: string, fieldName: string, fieldValue: unknown);
}
