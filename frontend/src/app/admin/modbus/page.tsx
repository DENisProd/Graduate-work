'use client';

import { ModbusDevicesPanel } from '@/components/features/admin/devices/ModbusDevicesPanel';

export default function ModbusAdminPage() {
  return (
    <div className="h-[calc(100vh-8rem)] px-1">
      <ModbusDevicesPanel />
    </div>
  );
}
