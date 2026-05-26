'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getHouseRole } from '@/components/ui/role-badge';
import { useTranslation, useCurrentUserId, useHousePermissions } from '@/hooks';
import { useAccessControlStore, type HouseDetailsTab, normalizeHouseDetailsTab } from '@/store/access-control-store';

import {
  HouseDetailsHeader,
  RoomsTab,
  MembersTab,
  RolesTab,
  DevicesTab,
  ScenariosTab,
} from '@/features/access-control/ui/house-details';

export interface HouseDetailsWidgetProps {
  houseIdParam: string | undefined;
  onRoomPlanner: () => void;
  isAdmin: boolean;
}

export function HouseDetailsWidget({
  houseIdParam,
  onRoomPlanner,
  isAdmin,
}: HouseDetailsWidgetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const house = useAccessControlStore((s) => s.house);
  const storeActiveTab = useAccessControlStore((s) => s.activeTab);
  const setActiveTab = useAccessControlStore((s) => s.setActiveTab);

  const activeTab = useMemo(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl ? normalizeHouseDetailsTab(tabFromUrl) : storeActiveTab;
  }, [searchParams, storeActiveTab]);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [setActiveTab, router, pathname, searchParams],
  );
  const setMemberModalOpen = useAccessControlStore((s) => s.setMemberModalOpen);
  const openMemberDetail = useAccessControlStore((s) => s.openMemberDetail);
  const removeMember = useAccessControlStore((s) => s.removeMember);
  const currentUserId = useCurrentUserId();

  const houseId = useMemo(() => {
    if (house?.id != null) return String(house.id);
    if (!houseIdParam) return null;
    return houseIdParam;
  }, [house, houseIdParam]);

  const perms = useHousePermissions();
  const canEditRoles = perms.canEditRoles;
  const currentUserRole =
    house?.ownerId && currentUserId ? getHouseRole(house.ownerId, currentUserId) : 'member';

  const tabs: Array<{ id: HouseDetailsTab; label: string }> = [
    { id: 'rooms', label: t('admin.accessControl.houseRooms') },
    { id: 'members', label: t('admin.accessControl.members') },
    { id: 'roles', label: t('admin.accessControl.roles') },
    { id: 'devices', label: t('admin.tabs.devices') },
    { id: 'scenarios', label: t('admin.accessControl.scenarios') },
  ] as const;



  return (
    <div className="space-y-6">
      <HouseDetailsHeader
        houseName={house?.name || t('admin.accessControl.houses')}
        role={currentUserRole}
        isAdmin={isAdmin}
        ownerId={house?.ownerId}
      />
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-10 w-full p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="px-4 py-2 text-base data-[state=active]:text-background"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="rooms">
          <RoomsTab
            houseIdParam={houseIdParam}
            onRoomPlanner={onRoomPlanner}
            isAdmin={isAdmin}
            canManage={perms.isOwner || perms.canManageDevices}
          />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab
            onAddMember={() => setMemberModalOpen(true)}
            onMemberClick={openMemberDetail}
            onRemoveMember={(member) => removeMember(member.userId)}
            canInvite={perms.canInviteMembers}
            canRemove={perms.isOwner || perms.canInviteMembers}
          />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab houseId={houseId} activeTab={activeTab} canEditRoles={canEditRoles} />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab
            houseId={houseId}
            activeTab={activeTab}
            canManage={perms.isOwner || perms.canManageDevices}
            detailsPathPrefix={
              houseId
                ? `${isAdmin ? '/admin/access-control/houses' : '/dashboard/houses'}/${encodeURIComponent(houseId)}/devices`
                : null
            }
          />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenariosTab houseId={houseId} activeTab={activeTab} canManage={perms.isOwner || perms.canManageAutomations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
