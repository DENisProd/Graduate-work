import type { CommandValueType } from '../types/widget.types';

export function coerceCommandValue(value: string, type: CommandValueType): unknown {
  if (type === 'number') return Number(value);
  if (type === 'boolean') return value === 'true';
  return value;
}
