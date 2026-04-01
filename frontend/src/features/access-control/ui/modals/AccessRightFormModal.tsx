'use client';

import { useEffect, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { devicesApi, deviceFunctionsApi, houseMembersApi, houseRoomsApi } from '@/lib/api-client';
import type { CreateAccessRightDto, AccessRightType } from '@/types/api';
import type { DeviceResponse, DeviceFunctionResponse, HouseMemberResponse, HouseRoomResponse } from '@/types/api';
import { useTranslation } from '@/hooks';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { toArray, toDateTimeLocal, getDisplayName } from '../../lib/utils';

interface AccessRightFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: number | string;
  onSubmit: (data: CreateAccessRightDto) => Promise<void>;
  /** Pre-select this house member when opening (e.g. from member detail modal). */
  initialHouseMemberId?: number | string | null;
}

export function AccessRightFormModal({
  isOpen,
  onOpenChange,
  houseId,
  onSubmit,
  initialHouseMemberId,
}: AccessRightFormModalProps) {
  const { t, locale } = useTranslation();
  const [houseMemberId, setHouseMemberId] = useState<string | null>(null);
  const [accessRightType, setAccessRightType] = useState<string | null>('ALLOW');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceFunctionId, setDeviceFunctionId] = useState<string | null>(null);
  const [houseRoomId, setHouseRoomId] = useState<string | null>(null);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

const [members, setMembers] = useState<HouseMemberResponse[]>([]);
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [deviceFunctions, setDeviceFunctions] = useState<DeviceFunctionResponse[]>([]);
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHouseMemberId(initialHouseMemberId != null ? String(initialHouseMemberId) : null);
      setAccessRightType('ALLOW');
      setDeviceId(null);
      setDeviceFunctionId(null);
      setHouseRoomId(null);
      setHasExpiration(false);
      setExpiresAt('');
      setDeviceFunctions([]);
    }
  }, [isOpen, initialHouseMemberId]);

  useEffect(() => {
    if (!isOpen || !houseId) return;
    setLoadingOptions(true);
    Promise.all([
      houseMembersApi.getByHouseId(houseId, { page: 0, size: 200 }).then((data) => setMembers(toArray<HouseMemberResponse>(data))),
      devicesApi.getAll({ page: 0, size: 200 }).then((res) => setDevices(res?.content ?? [])),
      houseRoomsApi.getByHouseId(houseId).then((data) => setRooms(toArray<HouseRoomResponse>(data))),
    ])
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [isOpen, houseId]);

  useEffect(() => {
    if (!deviceId) {
      setDeviceFunctions([]);
      setDeviceFunctionId(null);
      return;
    }
    deviceFunctionsApi
      .getByDeviceId(Number(deviceId))
      .then(setDeviceFunctions)
      .catch(() => setDeviceFunctions([]));
    setDeviceFunctionId(null);
  }, [deviceId]);

  const memberOptions = members.map((m) => ({ id: String(m.id), text: `${t('admin.accessControl.userId')} ${m.userId}` }));
  const deviceOptions = devices.map((d) => ({
    id: String(d.id),
    text: getDisplayName(d.translations as Record<string, { name?: string }>, d.name, d.code, locale) || d.code || String(d.id),
  }));
  const functionOptions = deviceFunctions.map((f) => ({
    id: String(f.id),
    text: getDisplayName(f.translations as Record<string, { name?: string }>, f.name, f.code, locale) || f.code || String(f.id),
  }));
  const roomOptions = [
    { id: '__none__', text: 'Не выбрано' },
    ...rooms.map((r) => ({ id: String(r.id), text: r.name || String(r.id) })),
  ];

  const accessRightTypeOptions = [
    { id: 'ALLOW', text: t('admin.accessControl.accessTypeAllow') },
    { id: 'DENY', text: t('admin.accessControl.accessTypeDeny') },
    { id: 'WRITE', text: t('admin.accessControl.accessTypeOnlyWrite') },
    { id: 'READ', text: t('admin.accessControl.accessTypeOnlyRead') },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resourceId = String(deviceFunctionId ?? deviceId ?? houseRoomId ?? houseId);
      const dto: CreateAccessRightDto = {
        resourceId,
        houseMemberId: houseMemberId ?? (initialHouseMemberId != null ? String(initialHouseMemberId) : undefined),
        accessRightType: (accessRightType as AccessRightType) || 'ALLOW',
        expiresAt: hasExpiration && expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };
      await onSubmit(dto);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('admin.create')} — {t('admin.accessControl.rights')}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid gap-4 pb-1 sm:grid-cols-2">
            {initialHouseMemberId == null && (
              <AdminSelect
                label={t('admin.accessControl.memberId')}
                placeholder={t('admin.accessControl.placeholders.memberId')}
                value={houseMemberId}
                onChange={setHouseMemberId}
                options={memberOptions}
                className="w-full"
                isDisabled={loadingOptions}
              />
            )}
            <AdminSelect
              label={t('admin.accessControl.operationType')}
              placeholder={t('admin.accessControl.placeholders.operationType')}
              value={accessRightType}
              onChange={setAccessRightType}
              options={accessRightTypeOptions}
              className="w-full"
              isDisabled={loadingOptions}
            />
            <AdminSelect
              label={t('admin.accessControl.houseRoomId')}
              placeholder={t('admin.accessControl.placeholders.houseRoomId')}
              value={houseRoomId ?? '__none__'}
              onChange={(value) => setHouseRoomId(value === '__none__' ? null : value)}
              options={roomOptions}
              className="w-full"
              isDisabled={loadingOptions}
            />
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <AdminSelect
                label={t('admin.accessControl.deviceId')}
                placeholder={t('admin.accessControl.placeholders.deviceId')}
                value={deviceId}
                onChange={setDeviceId}
                options={deviceOptions}
                className="w-full"
                isDisabled={loadingOptions}
              />
              <AdminSelect
                label={t('admin.accessControl.deviceFunctionId')}
                placeholder={t('admin.accessControl.placeholders.deviceFunctionId')}
                value={deviceFunctionId}
                onChange={setDeviceFunctionId}
                options={functionOptions}
                isDisabled={!deviceId || loadingOptions}
                className="w-full"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2 min-h-[40px]">
                <Switch checked={hasExpiration} onCheckedChange={setHasExpiration} />
                <span className="text-sm">{t('admin.accessControl.expiresAt')}</span>
              </div>
              {hasExpiration && (
                <input
                  type="datetime-local"
                  value={toDateTimeLocal(expiresAt)}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <AppButton variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </AppButton>
          <AppButton
            onClick={handleSubmit}
            disabled={loading}
          >
            {t('admin.create')}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
