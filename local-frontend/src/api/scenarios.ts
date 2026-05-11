import { api } from './client'
import type { Scenario, ScenarioDefinition, ScenarioExecution } from '@/types'

export async function listScenarios(params: { houseId?: string; page?: number; size?: number } = {}): Promise<Scenario[]> {
  const query: Record<string, string | number> = {}
  if (params.houseId) query.house_id = params.houseId
  if (params.page !== undefined) query.page = params.page
  if (params.size !== undefined) query.size = params.size

  const { data } = await api.get<Scenario[] | { content?: Scenario[] }>('/api/v1/scenarios', { params: query })
  if (Array.isArray(data)) return data
  return data?.content ?? []
}

export async function getScenario(id: string): Promise<Scenario> {
  const { data } = await api.get<Scenario>(`/api/v1/scenarios/${id}`)
  return data
}

export async function createScenario(body: {
  name: string
  description?: string
  houseId?: string
  definition: ScenarioDefinition
}): Promise<Scenario> {
  const { data } = await api.post<Scenario>('/api/v1/scenarios', body)
  return data
}

export async function updateScenario(
  id: string,
  body: Partial<{ name: string; description: string; houseId: string; definition: ScenarioDefinition }>,
): Promise<Scenario> {
  const { data } = await api.patch<Scenario>(`/api/v1/scenarios/${id}`, body)
  return data
}

export async function deleteScenario(id: string): Promise<void> {
  await api.delete(`/api/v1/scenarios/${id}`)
}

export async function triggerScenario(id: string): Promise<void> {
  await api.post('/api/v1/scenario-executions', { scenarioId: id })
}

interface ExecutionFilters {
  scenarioId?: string
  limit?: number
  page?: number
}

interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

export async function listExecutions(
  filters: ExecutionFilters = {},
): Promise<PagedResponse<ScenarioExecution>> {
  const { data } = await api.get<PagedResponse<ScenarioExecution>>(
    '/api/v1/scenario-executions',
    { params: filters },
  )
  return data
}
