'use client';

import { useEffect, useRef } from 'react';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { useConnectedLocalServers } from '@/features/access-control/model/use-connected-local-servers';
import { useDevicesTab } from '@/features/access-control/model/use-devices-tab';
import { DevicesListContent } from './DevicesListContent';
import { DevicesListHeader } from './DevicesListHeader';
import { DevicesPagination } from './DevicesPagination';

interface DevicesTabProps {
  houseId: string | null;
  activeTab: HouseDetailsTab;
  canManage?: boolean;
  detailsPathPrefix?: string | null;
}

export function DevicesTab({
  houseId,
  activeTab,
  canManage = true,
  detailsPathPrefix,
}: DevicesTabProps) {
  const openAddDeviceModal = useAddDeviceModalStore((s) => s.open);
  const addDeviceModalOpen = useAddDeviceModalStore((s) => s.isOpen);
  const prevAddDeviceModalOpenRef = useRef(addDeviceModalOpen);

  const {
    servers,
    loading: serversLoading,
    load: loadServers,
  } = useConnectedLocalServers();

  const {
    devices,
    devicesLoading,
    devicesError,
    devicesErrorDetails,
    devicesPage,
    devicesPages,
    getLiveState,
    isSocketConnected,
    loadDevices,
    removeDevice,
    setDevicesPage,
  } = useDevicesTab(houseId, activeTab);

  useEffect(() => {
    if (activeTab !== 'devices') return;
    void loadServers();
  }, [activeTab, loadServers]);

  useEffect(() => {
    const prev = prevAddDeviceModalOpenRef.current;
    prevAddDeviceModalOpenRef.current = addDeviceModalOpen;
    if (activeTab !== 'devices') return;
    if (prev && !addDeviceModalOpen) {
      void loadDevices();
      void loadServers();
    }
  }, [addDeviceModalOpen, activeTab, loadDevices, loadServers]);

  const resolvedDetailsPathPrefix =
    detailsPathPrefix ??
    (houseId ? `/admin/access-control/houses/${encodeURIComponent(houseId)}/devices` : null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DevicesListHeader
          houseId={houseId}
          onAddDevice={() => houseId && openAddDeviceModal(houseId)}
          canManage={canManage}
        />

        <DevicesListContent
          houseId={houseId}
          devices={devices}
          servers={servers}
          loading={devicesLoading || serversLoading}
          error={devicesError}
          errorDetails={devicesErrorDetails}
          getLiveState={getLiveState}
          isSocketConnected={isSocketConnected}
          detailsPathPrefix={resolvedDetailsPathPrefix}
          onRetry={() => void loadDevices()}
          onDeviceRemoved={canManage ? removeDevice : undefined}
        />

        {houseId && devicesPages > 1 ? (
          <DevicesPagination
            page={devicesPage}
            totalPages={devicesPages}
            onPageChange={setDevicesPage}
          />
        ) : null}
      </div>
    </div>
  );
}
