'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import type { HouseDetailsTab } from '@/store/access-control-store';
import { useConnectedLocalServers } from '@/features/access-control/model/use-connected-local-servers';
import { useDevicesTab } from '@/features/access-control/model/use-devices-tab';
import { houseMqttApi } from '@/lib/api-client';
import { useToast } from '@/components/shared';
import { useTranslation, useHouseFunctionAccess } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { DevicesListContent } from './DevicesListContent';
import { DevicesListHeader } from './DevicesListHeader';
import { DevicesPagination } from './DevicesPagination';
import { formatMqttLastError, mqttReconnectToastKey } from '@/features/access-control/lib/mqtt-reconnect-feedback';
import { HouseMqttBanner, useMqttStatusPolling } from './HouseMqttBanner';

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
  const { t } = useTranslation();
  const { showToast } = useToast();
  const openAddDeviceModal = useAddDeviceModalStore((s) => s.open);
  const addDeviceModalOpen = useAddDeviceModalStore((s) => s.isOpen);
  const prevAddDeviceModalOpenRef = useRef(addDeviceModalOpen);
  const [mqttReconnecting, setMqttReconnecting] = useState(false);
  const house = useAccessControlStore((s) => s.house);
  const { canControlPower } = useHouseFunctionAccess({ ownerId: house?.ownerId });

  const {
    servers,
    loading: serversLoading,
    load: loadServers,
  } = useConnectedLocalServers();

  const {
    devices,
    modbusDevices,
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
    mqttState,
    mqttConfig,
    refetchMqttStatus,
  } = useDevicesTab(houseId, activeTab);

  useMqttStatusPolling(activeTab === 'devices' && Boolean(houseId), refetchMqttStatus);

  const handleMqttReconnect = useCallback(async () => {
    if (!houseId) return;
    setMqttReconnecting(true);
    try {
      const cfg = await houseMqttApi.reconnect(houseId);
      await refetchMqttStatus();
      const outcome = mqttReconnectToastKey(cfg);
      if (outcome === 'success') {
        await loadDevices();
        showToast(t('admin.accessControl.connectedDevices.mqttBanner.reconnectSuccess'), 'success');
      } else {
        const detail = formatMqttLastError(cfg);
        showToast(
          detail
            ? t('admin.accessControl.connectedDevices.mqttBanner.reconnectFailedDetail', { detail })
            : t('admin.accessControl.connectedDevices.mqttBanner.reconnectFailed'),
          'error',
        );
      }
    } catch {
      showToast(t('admin.accessControl.connectedDevices.mqttNotConnected'), 'error');
    } finally {
      setMqttReconnecting(false);
    }
  }, [houseId, loadDevices, refetchMqttStatus, showToast, t]);

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

        {houseId ? (
          <HouseMqttBanner
            houseId={houseId}
            state={mqttState}
            config={mqttConfig}
            isSocketConnected={isSocketConnected}
            onReconnect={canManage ? () => void handleMqttReconnect() : undefined}
            reconnecting={mqttReconnecting}
            onRefresh={canManage ? () => void refetchMqttStatus() : undefined}
          />
        ) : null}

        <DevicesListContent
          houseId={houseId}
          devices={devices}
          modbusDevices={modbusDevices}
          servers={servers}
          loading={devicesLoading || serversLoading}
          error={devicesError}
          errorDetails={devicesErrorDetails}
          getLiveState={getLiveState}
          isSocketConnected={isSocketConnected}
          detailsPathPrefix={resolvedDetailsPathPrefix}
          onRetry={() => void loadDevices()}
          onDeviceRemoved={canManage ? removeDevice : undefined}
          canControlDevice={canControlPower}
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
