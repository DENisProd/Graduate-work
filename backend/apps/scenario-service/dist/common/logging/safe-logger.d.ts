import type { LoggerService } from '@nestjs/common';
export declare class SafeLogger implements LoggerService {
    log(message: unknown, context?: string): void;
    error(message: unknown, ...optionalParams: unknown[]): void;
    warn(message: unknown, context?: string): void;
    debug(message: unknown, context?: string): void;
    verbose(message: unknown, context?: string): void;
}
