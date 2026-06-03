export const domovoyCanvas = {
  primary: '#1A237E',
  primaryMid: '#3949AB',
  primarySoft: '#5C6BC0',
  primaryDeep: '#303F9F',
  primaryIndigoLight: '#9FA8DA',
  secondary: '#FF9800',
  secondaryDeep: '#F57C00',
  secondaryLight: '#FFB74D',
  teal: '#009688',
  tealDeep: '#00796B',
  tealBright: '#26A69A',
  tealDark: '#00695C',
  tealMutedLight: '#4DB6AC',
  selection: '#FF9800',
  handle: '#009688',
  handleHover: '#00796B',
  onAccent: '#FFFFFF',
  shadow: 'rgba(10, 14, 24, 0.35)',
} as const;

export const domovoyRoomPlanner = {
  gridStrokeLight: 'rgba(26, 35, 126, 0.14)',
  gridStrokeDark: 'rgba(200, 210, 255, 0.09)',
  wallNeutral: '#64748b',
  phantomMuted: 'rgba(148, 163, 184, 0.55)',
  measurement: '#78909C',
  boundsWarning: '#E53935',
  canvasSurfaceLight: '#f1f3f9',
  canvasSurfaceDark: '#212836',
  canvasShadowLight: '#1a237e',
  canvasShadowDark: '#0a0e18',
} as const;

export const ROOM_DEVICE_COLORS: Record<string, string> = {
  socket: domovoyCanvas.teal,
  switch: domovoyCanvas.primary,
  'motion-sensor': domovoyCanvas.secondary,
  'temperature-sensor': '#C62828',
  camera: domovoyCanvas.primarySoft,
  dimmer: domovoyCanvas.secondaryLight,
};

export function roomDeviceColor(type: string): string {
  return ROOM_DEVICE_COLORS[type] ?? '#78909C';
}

export const REGION_FILLS = [
  'rgba(26, 35, 126, 0.22)',
  'rgba(0, 150, 136, 0.22)',
  'rgba(255, 152, 0, 0.24)',
  'rgba(57, 73, 171, 0.22)',
  'rgba(0, 121, 107, 0.22)',
  'rgba(245, 124, 0, 0.22)',
] as const;

export function getRegionFill(index: number): string {
  return REGION_FILLS[index % REGION_FILLS.length]!;
}

export function scenarioNodeColor(
  type: 'start' | 'end' | 'trigger' | 'condition' | string,
  theme: 'light' | 'dark',
): string {
  const dark = theme === 'dark';
  switch (type) {
    case 'start':
      return dark ? domovoyCanvas.primarySoft : domovoyCanvas.primary;
    case 'end':
      return dark ? domovoyCanvas.secondaryLight : domovoyCanvas.secondaryDeep;
    case 'trigger':
      return dark ? domovoyCanvas.tealBright : domovoyCanvas.tealDeep;
    case 'condition':
      return dark ? domovoyCanvas.primaryIndigoLight : domovoyCanvas.primaryDeep;
    default:
      return dark ? domovoyCanvas.tealMutedLight : domovoyCanvas.tealDark;
  }
}

export function regionLabelFill(resolvedTheme: string): string {
  return resolvedTheme === 'dark' ? '#E8EAF6' : '#1A1F32';
}

export function regionStrokeColors(theme: 'light' | 'dark') {
  const dark = theme === 'dark';
  return {
    default: dark ? 'rgba(232, 234, 246, 0.28)' : 'rgba(26, 35, 126, 0.18)',
    selected: dark ? 'rgba(159, 168, 218, 0.95)' : 'rgba(26, 35, 126, 0.88)',
  };
}
