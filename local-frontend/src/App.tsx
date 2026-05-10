import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { PhysicalDevicesPage } from '@/pages/PhysicalDevicesPage'
import { ZigbeePage } from '@/pages/ZigbeePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ScenariosPage } from '@/pages/ScenariosPage'
import { ScenarioEditorPage } from '@/pages/ScenarioEditorPage'
import { HousesPage } from '@/pages/HousesPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="devices" element={<PhysicalDevicesPage />} />
        <Route path="zigbee" element={<ZigbeePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="scenarios/new" element={<ScenarioEditorPage />} />
        <Route path="scenarios/:id/edit" element={<ScenarioEditorPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
