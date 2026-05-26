'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';

interface DevicesListHeaderProps {
  houseId: string | null;
  onAddDevice: () => void;
  canManage?: boolean;
}

export function DevicesListHeader({ houseId, onAddDevice, canManage = true }: DevicesListHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-sm font-semibold text-foreground">
        {t('admin.accessControl.connectedDevices.sectionTitle')}
      </h1>
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <AppButton size="sm" onClick={onAddDevice} disabled={!houseId}>
            {t('admin.accessControl.addDevice.button')}
          </AppButton>
        </div>
      )}
    </div>
  );
}
