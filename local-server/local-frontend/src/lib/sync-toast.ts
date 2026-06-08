import type { SyncReport } from '@/api/system'

type Translate = (key: string, vars?: Record<string, string | number | undefined>) => string

export function buildSyncToastMessage(report: SyncReport, t: Translate): string {
  const parts: string[] = []

  const push = (key: string, count: number | undefined) => {
    if (count != null && count > 0) {
      parts.push(t(key, { count }))
    }
  }

  push('syncPanel.syncPartHouses', report.housesUpserted)
  push('syncPanel.syncPartRooms', report.roomsUpserted)
  push('syncPanel.syncPartRoles', report.rolesUpserted)
  push('syncPanel.syncPartMembers', report.membersUpserted)
  push('syncPanel.syncPartScenarios', report.scenariosUpserted)
  push('syncPanel.syncPartDashboards', report.dashboardsUpserted)

  if (parts.length === 0) {
    return t('syncPanel.toastOkEmpty')
  }

  return t('syncPanel.toastOk', { details: parts.join(', ') })
}
