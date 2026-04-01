'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import type { HouseDetailsTab } from '@/store/access-control-store';

interface HouseDetailsTabButtonsProps {
  activeTab: HouseDetailsTab;
  onTabChange: (tab: HouseDetailsTab) => void;
}

export function HouseDetailsTabButtons({ activeTab, onTabChange }: HouseDetailsTabButtonsProps) {
  const { t } = useTranslation();
  const tabs: { id: HouseDetailsTab; label: string }[] = [
    { id: 'rooms', label: t('admin.accessControl.houseRooms') },
    { id: 'members', label: t('admin.accessControl.members') },
    { id: 'roles', label: t('admin.accessControl.roles') },
    { id: 'devices', label: t('admin.tabs.devices') },
    { id: 'scenarios', label: t('admin.accessControl.scenarios') },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ id, label }) => (
        <AppButton
          key={id}
          size="sm"
          variant={activeTab === id ? 'default' : 'secondary'}
          onClick={() => onTabChange(id)}
        >
          {label}
        </AppButton>
      ))}
    </div>
  );
}
