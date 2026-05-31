import { api } from './client'

export type WidgetType =
  | 'TELEMETRY_VALUE'
  | 'DEVICE_STATUS'
  | 'CONTROL_BUTTON'
  | 'CONTROL_TOGGLE'
  | 'SCENARIO_TRIGGER'
  | 'TEXT_LABEL'
  | 'GAUGE_DIAL'
  | 'CIRCULAR_PROGRESS'
  | 'SLIDER_CONTROL'
  | 'DEVICE_HERO'
  | 'MINI_LINE_CHART'

export interface WidgetInstance {
  id: string
  type: WidgetType
  config: Record<string, unknown>
}

export interface WidgetLayout {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface LocalWidgetDashboard {
  id: string
  houseId: string
  userId: string
  name: string
  isDefault: boolean
  layouts: Record<string, WidgetLayout[]>
  widgets: WidgetInstance[]
  cloudId: string | null
  createdAt: string
  updatedAt: string
}

export async function listWidgetDashboards(houseId: string): Promise<LocalWidgetDashboard[]> {
  const { data } = await api.get<LocalWidgetDashboard[]>('/api/v1/widget-dashboards', {
    params: { houseId },
  })
  return data
}
