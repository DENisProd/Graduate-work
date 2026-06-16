export type CommandValueType = 'text' | 'number' | 'boolean'
export type WidgetCommandSource = 'zigbee' | 'modbus'

export function coerceCommandValue(value: string, type: CommandValueType): unknown {
  if (type === 'number') return Number(value)
  if (type === 'boolean') return value === 'true'
  return value
}
