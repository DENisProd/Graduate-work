function xyToRgb(x: number, y: number): [number, number, number] {
  const z = 1.0 - x - y;
  const Y = 1.0;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;
  const gamma = (c: number) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  r = gamma(r);
  g = gamma(g);
  b = gamma(b);
  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(b * 255))),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const byte = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export function hsToHex(hue: number, saturation: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = 0.5;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const byte = (n: number) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export function hexToHs(hex: string): { hue: number; saturation: number } {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return { hue: 0, saturation: 100 };
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0 };
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  const saturation = Math.round((delta / max) * 100);
  return { hue, saturation };
}

function readColorObject(
  color: Record<string, unknown>,
): { hue: number; saturation: number; x?: number; y?: number } {
  if (typeof color.hue === 'number' && typeof color.saturation === 'number') {
    return { hue: color.hue, saturation: color.saturation };
  }
  if (typeof color.x === 'number' && typeof color.y === 'number') {
    const [r, g, b] = xyToRgb(color.x, color.y);
    const hs = hexToHs(rgbToHex(r, g, b));
    return { hue: hs.hue, saturation: hs.saturation, x: color.x, y: color.y };
  }
  return { hue: 0, saturation: 100 };
}

export function readZigbeeColor(
  payload: Record<string, unknown> | undefined,
): { hue: number; saturation: number; x?: number; y?: number } {
  if (!payload) return { hue: 0, saturation: 100 };
  const nested = payload.color;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return readColorObject(nested as Record<string, unknown>);
  }
  if (typeof payload.x === 'number' && typeof payload.y === 'number') {
    return readColorObject({ x: payload.x, y: payload.y });
  }
  return {
    hue: typeof payload.hue === 'number' ? payload.hue : 0,
    saturation: typeof payload.saturation === 'number' ? payload.saturation : 100,
  };
}

export function zigbeeColorCommand(
  hue: number,
  saturation: number,
  options?: { x?: number; y?: number; turnOn?: boolean },
): Record<string, unknown> {
  const roundedHue = Math.round(hue);
  const roundedSat = Math.round(Math.max(0, Math.min(100, saturation)));
  const color =
    options?.x != null && options?.y != null
      ? { x: options.x, y: options.y }
      : { hue: roundedHue, saturation: roundedSat };

  const cmd: Record<string, unknown> = { color };
  if (options?.turnOn !== false) {
    cmd.state = 'ON';
  }
  return cmd;
}

export function hasZigbeeColorCapability(capabilities: Iterable<string>): boolean {
  const caps = new Set([...capabilities].map((c) => c.toLowerCase()));
  return (
    caps.has('color') ||
    caps.has('hue') ||
    caps.has('saturation') ||
    caps.has('x') ||
    caps.has('y') ||
    caps.has('color_xy') ||
    caps.has('color_hs')
  );
}

export function hasZigbeeColorState(
  payload: Record<string, unknown> | undefined,
  colorMode?: string | null,
): boolean {
  if (!payload && !colorMode) return false;
  const mode = colorMode?.toLowerCase();
  if (mode && ['xy', 'hs', 'hue', 'enhanced_hue', 'color'].includes(mode)) {
    return true;
  }
  if (!payload) return false;
  return (
    payload.color != null ||
    payload.hue != null ||
    payload.saturation != null ||
    payload.x != null ||
    payload.y != null
  );
}
