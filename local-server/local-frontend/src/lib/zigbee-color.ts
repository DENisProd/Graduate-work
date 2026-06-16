export function hsToHex(hue: number, saturation: number): string {
  const h = ((hue % 360) + 360) % 360
  const s = Math.max(0, Math.min(100, saturation)) / 100
  const l = 0.5
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const byte = (n: number) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

export function hexToHs(hex: string): { hue: number; saturation: number } {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return { hue: 0, saturation: 100 }
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return { hue: 0, saturation: 0 }
  let hue = 0
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  const saturation = Math.round((delta / max) * 100)
  return { hue, saturation }
}

export function readZigbeeColor(
  payload: Record<string, unknown> | undefined,
): { hue: number; saturation: number } {
  if (!payload) return { hue: 0, saturation: 100 }
  const nested = payload.color
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const c = nested as Record<string, unknown>
    return {
      hue: typeof c.hue === 'number' ? c.hue : 0,
      saturation: typeof c.saturation === 'number' ? c.saturation : 100,
    }
  }
  return {
    hue: typeof payload.hue === 'number' ? payload.hue : 0,
    saturation: typeof payload.saturation === 'number' ? payload.saturation : 100,
  }
}

export function zigbeeColorCommand(
  hue: number,
  saturation: number,
): Record<string, unknown> {
  return {
    color: {
      hue: Math.round(hue),
      saturation: Math.round(Math.max(0, Math.min(100, saturation))),
    },
  }
}

export function hasZigbeeColorCapability(capabilities: Iterable<string>): boolean {
  const caps = new Set([...capabilities].map((c) => c.toLowerCase()))
  return (
    caps.has('color') ||
    caps.has('hue') ||
    caps.has('saturation') ||
    caps.has('x') ||
    caps.has('y')
  )
}
