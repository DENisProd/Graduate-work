'use client';

import { useMemo, useState, useEffect } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  HouseInvitationRequest,
  HouseInvitationResponse,
  HouseRoleResponse,
  InvitationPermission,
  InvitationAccessRight,
  AccessRightType,
  DeviceResponse,
  DeviceFunctionResponse,
  HouseRoomResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { AdminSelect } from '@/components/shared/AdminSelect';
import { toDateTimeLocal, getDisplayName, toArray } from '../../lib/utils';
import { houseRolesApi, devicesApi, deviceFunctionsApi, houseRoomsApi } from '@/lib/api-client';
import QRCode from 'react-qr-code';

const ALL_PERMISSIONS: InvitationPermission[] = [
  'INVITE_MEMBERS',
  'EDIT_ROLES',
  'MANAGE_DEVICES',
  'MANAGE_AUTOMATIONS',
];

type Mode = 'role' | 'permissions' | 'rights';

interface InvitationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: number | string;
  onSubmit: (data: HouseInvitationRequest) => Promise<HouseInvitationResponse>;
}

export function InvitationFormModal({
  isOpen,
  onOpenChange,
  houseId,
  onSubmit,
}: InvitationFormModalProps) {
  const { t, locale } = useTranslation();

  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [mode, setMode] = useState<Mode>('role');
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // ── Role mode ──────────────────────────────────────────────────────────────
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<HouseRoleResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // ── Domain permissions mode ────────────────────────────────────────────────
  const [permissions, setPermissions] = useState<InvitationPermission[]>([]);

  // ── Access rights mode ─────────────────────────────────────────────────────
  const [accessRightType, setAccessRightType] = useState<AccessRightType>('ALLOW');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceFunctionId, setDeviceFunctionId] = useState<string | null>(null);
  const [houseRoomId, setHouseRoomId] = useState<string | null>(null);
  const [parametersJson, setParametersJson] = useState('');
  const [hasRightExpiry, setHasRightExpiry] = useState(false);
  const [rightExpiresAt, setRightExpiresAt] = useState('');

  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [deviceFunctions, setDeviceFunctions] = useState<DeviceFunctionResponse[]>([]);
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const createdInviteUrl = useMemo(() => {
    if (!createdToken) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite?token=${encodeURIComponent(createdToken)}`;
  }, [createdToken]);

  // Load roles on open
  useEffect(() => {
    if (!isOpen || !houseId) return;
    setRolesLoading(true);
    houseRolesApi
      .getHouseRoles(houseId)
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [isOpen, houseId]);

  // Load devices + rooms when rights tab is opened
  useEffect(() => {
    if (!isOpen || !houseId || mode !== 'rights') return;
    if (devices.length > 0 || resourcesLoading) return;
    setResourcesLoading(true);
    Promise.all([
      devicesApi.getAll({ page: 0, size: 200 }).then((res) => setDevices(res?.content ?? [])),
      houseRoomsApi.getByHouseId(houseId).then((data) => setRooms(toArray<HouseRoomResponse>(data))),
    ])
      .catch(() => {})
      .finally(() => setResourcesLoading(false));
  }, [isOpen, houseId, mode]);

  // Load device functions when device changes
  useEffect(() => {
    if (!deviceId) { setDeviceFunctions([]); setDeviceFunctionId(null); return; }
    deviceFunctionsApi
      .getByDeviceId(Number(deviceId))
      .then(setDeviceFunctions)
      .catch(() => setDeviceFunctions([]));
    setDeviceFunctionId(null);
  }, [deviceId]);

  const reset = () => {
    setNote('');
    setExpiresAt(''); setMode('role');
    setRoleId('');
    setPermissions([]);
    setAccessRightType('ALLOW'); setDeviceId(null); setDeviceFunctionId(null);
    setHouseRoomId(null); setParametersJson(''); setHasRightExpiry(false); setRightExpiresAt('');
    setDevices([]); setDeviceFunctions([]); setRooms([]);
    setCreatedToken(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let accessRight: InvitationAccessRight | undefined;
      if (mode === 'rights') {
        const params = parametersJson.trim()
          ? (JSON.parse(parametersJson) as Record<string, string>)
          : null;
        accessRight = {
          accessRightType,
          deviceId: deviceId ? Number(deviceId) : null,
          deviceFunctionId: deviceFunctionId ? Number(deviceFunctionId) : null,
          houseRoomId: houseRoomId ? Number(houseRoomId) : null,
          parameters: params,
          expiresAt: hasRightExpiry && rightExpiresAt ? new Date(rightExpiresAt).toISOString() : null,
        };
      }

      const res = await onSubmit({
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(mode === 'role' && roleId ? { roleId } : {}),
        ...(mode === 'permissions' && permissions.length > 0 ? { permissions } : {}),
        ...(mode === 'rights' && accessRight ? { accessRight } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      setCreatedToken(res?.token ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const togglePermission = (perm: InvitationPermission) =>
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );

  const getPermLabel = (perm: InvitationPermission): string => {
    switch (perm) {
      case 'INVITE_MEMBERS': return t('admin.accessControl.permInviteMembers');
      case 'EDIT_ROLES':     return t('admin.accessControl.permEditRoles');
      case 'MANAGE_DEVICES': return t('admin.accessControl.permManageDevices');
      case 'MANAGE_AUTOMATIONS': return t('admin.accessControl.permManageAutomations');
    }
  };

  const accessRightTypeOptions = [
    { id: 'ALLOW',      text: t('admin.accessControl.accessTypeAllow') },
    { id: 'DENY',       text: t('admin.accessControl.accessTypeDeny') },
    { id: 'ONLY_WRITE', text: t('admin.accessControl.accessTypeOnlyWrite') },
    { id: 'ONLY_READ',  text: t('admin.accessControl.accessTypeOnlyRead') },
  ];

  const deviceOptions = devices.map((d) => ({
    id: String(d.id),
    text: getDisplayName(d.translations as Record<string, { name?: string }>, d.name, d.code, locale) || d.code || String(d.id),
  }));

  const functionOptions = deviceFunctions.map((f) => ({
    id: String(f.id),
    text: getDisplayName(f.translations as Record<string, { name?: string }>, f.name, f.code, locale) || f.code || String(f.id),
  }));

  const roomOptions = [
    { id: '__none__', text: '—' },
    ...rooms.map((r) => ({ id: String(r.id), text: r.name || String(r.id) })),
  ];

  const formatParametersJson = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try { setParametersJson(JSON.stringify(JSON.parse(trimmed), null, 2)); }
    catch { setParametersJson(value); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.inviteMember')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {createdInviteUrl && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t('admin.accessControl.copyLink')}</p>
                <p className="font-mono text-xs text-muted-foreground break-all">{createdInviteUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  size="sm"
                  onClick={() => {
                    try {
                      void navigator.clipboard.writeText(createdInviteUrl);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  {t('admin.accessControl.copyLink')}
                </AppButton>
                <AppButton size="sm" variant="secondary" onClick={() => setCreatedToken(null)}>
                  {t('common.cancel')}
                </AppButton>
              </div>
              <div className="flex items-center justify-center rounded-lg border border-border bg-background p-4">
                <QRCode value={createdInviteUrl} size={180} />
              </div>
            </div>
          )}

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="role" className="flex-1 data-[state=active]:text-white">
                {t('admin.accessControl.invitationModeRole')}
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex-1 data-[state=active]:text-white">
                {t('admin.accessControl.invitationModePermissions')}
              </TabsTrigger>
              <TabsTrigger value="rights" className="flex-1 data-[state=active]:text-white">
                {t('admin.accessControl.rights')}
              </TabsTrigger>
            </TabsList>

            {/* Tab: Role */}
            <TabsContent value="role" className="mt-3 space-y-1">
              <label htmlFor="invite-role" className="text-sm font-medium text-foreground">
                {t('admin.accessControl.role')}{' '}
                <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
              </label>
              {roles.length > 0 ? (
                <select
                  id="invite-role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">—</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name ?? r.code ?? r.id}</option>
                  ))}
                </select>
              ) : (
                <Input
                  id="invite-role"
                  placeholder={t('admin.accessControl.placeholders.roleId')}
                  value={roleId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleId(e.target.value)}
                />
              )}
              {rolesLoading && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t('common.loading')}</p>
              )}
            </TabsContent>

            {/* Tab: Domain permissions */}
            <TabsContent value="permissions" className="mt-3 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t('admin.accessControl.invitationPermissions')}
              </p>
              <div className="space-y-3 rounded-lg border border-border p-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm text-foreground">{getPermLabel(perm)}</span>
                  </label>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Access rights */}
            <TabsContent value="rights" className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminSelect
                  label={t('admin.accessControl.operationType')}
                  placeholder={t('admin.accessControl.placeholders.operationType')}
                  value={accessRightType}
                  onChange={(v) => setAccessRightType((v ?? 'ALLOW') as AccessRightType)}
                  options={accessRightTypeOptions}
                  className="w-full"
                  isDisabled={resourcesLoading}
                />
                <AdminSelect
                  label={t('admin.accessControl.houseRoom')}
                  placeholder={t('admin.accessControl.placeholders.houseRoomId')}
                  value={houseRoomId ?? '__none__'}
                  onChange={(v) => setHouseRoomId(v === '__none__' ? null : v)}
                  options={roomOptions}
                  className="w-full"
                  isDisabled={resourcesLoading}
                />
                <AdminSelect
                  label={t('admin.device')}
                  placeholder={t('admin.accessControl.placeholders.deviceId')}
                  value={deviceId}
                  onChange={setDeviceId}
                  options={deviceOptions}
                  className="w-full"
                  isDisabled={resourcesLoading}
                />
                <AdminSelect
                  label={t('admin.deviceFunction')}
                  placeholder={t('admin.accessControl.placeholders.deviceFunctionId')}
                  value={deviceFunctionId}
                  onChange={setDeviceFunctionId}
                  options={functionOptions}
                  isDisabled={!deviceId || resourcesLoading}
                  className="w-full"
                />
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={hasRightExpiry} onCheckedChange={setHasRightExpiry} />
                    <span className="text-sm text-foreground">{t('admin.accessControl.expiresAt')}</span>
                  </div>
                  {hasRightExpiry && (
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(rightExpiresAt)}
                      onChange={(e) => setRightExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('admin.accessControl.parameters')}
                  </label>
                  <Textarea
                    placeholder={t('admin.accessControl.placeholders.parameters')}
                    value={parametersJson}
                    onChange={(e) => setParametersJson(e.target.value)}
                    onBlur={(e) => formatParametersJson(e.target.value)}
                    className="min-h-20 font-mono text-xs"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Invitation expiry */}
          <div className="space-y-1">
            <label htmlFor="invite-note" className="text-sm font-medium text-foreground">
              Пометка <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
            </label>
            <Input
              id="invite-note"
              placeholder="Например: Для мамы / временный доступ"
              value={note}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invite-expire" className="text-sm font-medium text-foreground">
              {t('admin.accessControl.expiresAt')}{' '}
              <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
            </label>
            <input
              id="invite-expire"
              type="datetime-local"
              value={toDateTimeLocal(expiresAt)}
              onChange={(e) =>
                setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
              }
              className="w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </div>

        <DialogFooter>
          <AppButton variant="secondary" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </AppButton>
          {!createdToken && (
            <AppButton onClick={handleSubmit} disabled={loading}>
              {t('admin.create')}
            </AppButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
