import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { ZigbeePage } from '@/pages/ZigbeePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ScenariosPage } from '@/pages/ScenariosPage'
import { ScenarioEditorPage } from '@/pages/ScenarioEditorPage'
import { HousesPage } from '@/pages/HousesPage'
import { ModbusPage } from '@/pages/ModbusPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="devices" element={<ZigbeePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="scenarios/new" element={<ScenarioEditorPage />} />
        <Route path="scenarios/:id/edit" element={<ScenarioEditorPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="modbus" element={<ModbusPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
