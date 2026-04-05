"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeLogger = void 0;
function safeToString(value) {
    if (typeof value === 'string')
        return value;
    if (value instanceof Error) {
        return value.stack ?? `${value.name}: ${value.message}`;
    }
    try {
        const seen = new WeakSet();
        return JSON.stringify(value, (_key, v) => {
            if (typeof v === 'bigint')
                return v.toString();
            if (typeof v === 'object' && v !== null) {
                if (seen.has(v))
                    return '[Circular]';
                seen.add(v);
            }
            return v;
        }, 2);
    }
    catch {
        try {
            return String(value);
        }
        catch {
            return '[Unstringifiable]';
        }
    }
}
function nowStamp() {
    return new Date().toISOString();
}
class SafeLogger {
    log(message, context) {
        console.log(`[${nowStamp()}] LOG${context ? ` [${context}]` : ''} ${safeToString(message)}`);
    }
    error(message, ...optionalParams) {
        const context = optionalParams.length && typeof optionalParams.at(-1) === 'string'
            ? optionalParams.at(-1)
            : undefined;
        const details = optionalParams.length && context
            ? optionalParams.slice(0, -1).map(safeToString).join('\n')
            : optionalParams.map(safeToString).join('\n');
        console.error(`[${nowStamp()}] ERROR${context ? ` [${context}]` : ''} ${safeToString(message)}${details ? `\n${details}` : ''}`);
    }
    warn(message, context) {
        console.warn(`[${nowStamp()}] WARN${context ? ` [${context}]` : ''} ${safeToString(message)}`);
    }
    debug(message, context) {
        console.debug(`[${nowStamp()}] DEBUG${context ? ` [${context}]` : ''} ${safeToString(message)}`);
    }
    verbose(message, context) {
        console.info(`[${nowStamp()}] VERBOSE${context ? ` [${context}]` : ''} ${safeToString(message)}`);
    }
}
exports.SafeLogger = SafeLogger;
//# sourceMappingURL=safe-logger.js.map