import type { LoggerService } from '@nestjs/common';

function safeToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }

  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return v;
      },
      2,
    );
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unstringifiable]';
    }
  }
}

function nowStamp(): string {
  return new Date().toISOString();
}

export class SafeLogger implements LoggerService {
  log(message: unknown, context?: string) {
    console.log(
      `[${nowStamp()}] LOG${context ? ` [${context}]` : ''} ${safeToString(message)}`,
    );
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    const context =
      optionalParams.length && typeof optionalParams.at(-1) === 'string'
        ? (optionalParams.at(-1) as string)
        : undefined;

    const details =
      optionalParams.length && context
        ? optionalParams.slice(0, -1).map(safeToString).join('\n')
        : optionalParams.map(safeToString).join('\n');

    console.error(
      `[${nowStamp()}] ERROR${context ? ` [${context}]` : ''} ${safeToString(message)}${
        details ? `\n${details}` : ''
      }`,
    );
  }

  warn(message: unknown, context?: string) {
    console.warn(
      `[${nowStamp()}] WARN${context ? ` [${context}]` : ''} ${safeToString(message)}`,
    );
  }

  debug(message: unknown, context?: string) {
    console.debug(
      `[${nowStamp()}] DEBUG${context ? ` [${context}]` : ''} ${safeToString(message)}`,
    );
  }

  verbose(message: unknown, context?: string) {
    console.info(
      `[${nowStamp()}] VERBOSE${context ? ` [${context}]` : ''} ${safeToString(message)}`,
    );
  }
}
