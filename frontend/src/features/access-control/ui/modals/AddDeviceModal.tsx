'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { env } from '@/config/env.config';
import { ApiError, physicalDevicesApi, zigbeeDevicesApi } from '@/lib/api-client';
import { deviceCategoriesApi } from '@/lib/api/device-service';
import { useTranslation } from '@/hooks';
import { usePairing } from '../../hooks/usePairing';
import type { PairingDevice } from '../../hooks/usePairing';

interface AddDeviceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string | null;
  onDeviceAdded?: () => void;
  onClose: () => void;
}

const SEARCH_DURATION = 240;
const MAX_CATEGORIES = 2000;

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatTime(s: number) {
  return `${pad2(s / 60)}:${pad2(s % 60)}`;
}

function StatusIcon({ status }: { status: PairingDevice['status'] }) {
  if (status === 'joining' || status === 'interviewing') {
    return (
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-primary" />
    );
  }
  if (status === 'done') {
    return (
      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function AddDeviceModal({
  isOpen,
  onOpenChange,
  houseId,
  onDeviceAdded,
  onClose,
}: AddDeviceModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [startError, setStartError] = useState<string | null>(null);
  const addedIeees = useRef(new Set<string>());
  const [selected, setSelected] = useState<PairingDevice | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [existing, setExisting] = useState<{ ieee: Set<string>; physicalIds: Set<string> }>({
    ieee: new Set<string>(),
    physicalIds: new Set<string>(),
  });

  const { isActive, isSocketConnected, timeLeft, devices, start, stop, clearDevices } = usePairing({
    enabled: isOpen,
    houseId,
  });

  useEffect(() => {
    if (!isOpen || !houseId) return;
    let cancelled = false;
    (async () => {
      try {
        // scenario-service enforces limit<=100 in Zod pagination schema
        const limit = 100;
        const allItems: Array<{
          ieeeAddr?: string | null;
          physicalDeviceId?: string | null;
          id?: string | null;
        }> = [];

        for (let page = 1; page <= 50; page++) {
          const result = await zigbeeDevicesApi.list({ houseId, page, limit });
          const pageItems: Array<{
            ieeeAddr?: string | null;
            physicalDeviceId?: string | null;
            id?: string | null;
          }> = Array.isArray(result)
            ? (result as any[])
            : (result && typeof result === 'object' && Array.isArray((result as any).items))
              ? ((result as any).items as any[])
              : (result && typeof result === 'object' && Array.isArray((result as any).data))
                ? ((result as any).data as any[])
                : (result && typeof result === 'object' && Array.isArray((result as any).content))
                  ? ((result as any).content as any[])
                  : [];

          allItems.push(...pageItems);
          if (pageItems.length < limit) break;
        }

        if (cancelled) return;
        const ieee = new Set<string>();
        const physicalIds = new Set<string>();
        for (const d of allItems) {
          if (typeof d.ieeeAddr === 'string' && d.ieeeAddr) ieee.add(d.ieeeAddr);
          if (typeof d.physicalDeviceId === 'string' && d.physicalDeviceId) physicalIds.add(d.physicalDeviceId);
          if (typeof d.id === 'string' && d.id) physicalIds.add(d.id);
        }
        setExisting({ ieee, physicalIds });
      } catch (e) {
        // Pairing should still work even if this fails; just don't filter.
        if (e instanceof ApiError && e.status === 401) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, houseId]);

  useEffect(() => {
    if (!isOpen && isActive) {
      clearDevices();
      addedIeees.current.clear();
      setExisting({ ieee: new Set<string>(), physicalIds: new Set<string>() });
    }
  }, [isOpen, isActive, clearDevices]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelected(null);
    setDeviceName('');
    setCategoryId(null);
    setCategories([]);
    setCategoriesError(null);
    setSaving(false);
    setSaveError(null);
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isActive) void stop();
      clearDevices();
      addedIeees.current.clear();
      setStartError(null);
      setStep(1);
      setSelected(null);
      setDeviceName('');
      setCategoryId(null);
      setSaveError(null);
      onClose();
    }
    onOpenChange(open);
  };

  const handleStart = async () => {
    setStartError(null);
    const result = await start(SEARCH_DURATION);
    if (!result.ok) setStartError(result.error ?? t('admin.accessControl.pairing.startError'));
  };

  const handleDeviceAdded = (ieeeAddr: string) => {
    addedIeees.current.add(ieeeAddr);
    setExisting((prev) => {
      const ieee = new Set(prev.ieee);
      ieee.add(ieeeAddr);
      return { ...prev, ieee };
    });
    onDeviceAdded?.();
  };

  const progressPct = isActive ? (timeLeft / SEARCH_DURATION) * 100 : 0;
  const visibleDevices = useMemo(() => {
    const existingIeee = existing.ieee;
    const existingPhysical = existing.physicalIds;
    return devices.filter((d) => {
      if (addedIeees.current.has(d.ieeeAddr)) return false;
      if (existingIeee.has(d.ieeeAddr)) return false;
      if (d.physicalDeviceId && existingPhysical.has(d.physicalDeviceId)) return false;
      return true;
    });
  }, [devices, existing.ieee, existing.physicalIds]);

  const canSelect = (d: PairingDevice) =>
    d.status === 'done' && Boolean(d.physicalDeviceId);

  const handleSelect = async (d: PairingDevice) => {
    setSelected(d);
    const fallback =
      (d.friendlyName && !d.friendlyName.startsWith('0x') ? d.friendlyName : '') ||
      d.model ||
      (d.manufacturer && d.model ? `${d.manufacturer} ${d.model}` : '') ||
      'New device';
    setDeviceName(fallback);
    setStep(2);

    try {
      setCategoriesError(null);
      const all = await deviceCategoriesApi.getAll();
      const items = (all ?? [])
        .slice(0, MAX_CATEGORIES)
        .map((c) => ({ id: c.id, name: (c as any).name ?? c.code ?? String(c.id) }));
      setCategories(items);
    } catch {
      setCategoriesError('Не удалось загрузить категории устройств');
    }
  };

  const handleSave = async () => {
    if (!houseId || !selected?.physicalDeviceId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const name = deviceName.trim();
      if (!name) {
        setSaveError('Введите название устройства');
        return;
      }
      await physicalDevicesApi.update(selected.physicalDeviceId, {
        houseId,
        name,
        ...(categoryId ? { deviceCategoryId: categoryId } : {}),
      });
      handleDeviceAdded(selected.ieeeAddr);
      setStep(3);
    } catch {
      setSaveError(t('admin.accessControl.pairing.addError'));
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.pairing.title')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {step === 1
                ? '1. Сопряжение'
                : step === 2
                  ? '2. Настройка'
                  : '3. Рекомендованные сценарии'}
            </span>
            {step !== 1 && (
              <AppButton
                variant="secondary"
                size="sm"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1))}
              >
                Назад
              </AppButton>
            )}
          </div>

          {!isSocketConnected && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              {t('admin.accessControl.pairing.noSocket', { gateway: env.GATEWAY_URL })}
            </div>
          )}

          {step === 1 && !isActive && devices.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.accessControl.pairing.description')}
              </p>

              {startError && (
                <p className="text-xs text-destructive">{startError}</p>
              )}

              <AppButton
                onClick={handleStart}
                disabled={!isSocketConnected || !houseId}
                className="w-full"
              >
                {t('admin.accessControl.pairing.start')}
              </AppButton>
              {!houseId && (
                <p className="text-[11px] text-muted-foreground">
                  Сначала выберите дом, чтобы начать сопряжение.
                </p>
              )}
            </div>
          )}

          {step === 1 && isActive && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {t('admin.accessControl.pairing.searching')}
                  </span>
                  <span className="font-mono tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <AppButton
                variant="secondary"
                size="sm"
                onClick={stop}
                className="w-full"
              >
                {t('admin.accessControl.pairing.stop')}
              </AppButton>
            </div>
          )}

          {step === 1 && visibleDevices.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {t('admin.accessControl.pairing.found', { count: visibleDevices.length })}
              </p>
              <div className="space-y-2">
                {visibleDevices.map((device) => (
                  <div
                    key={device.ieeeAddr}
                    className={cn(
                      'rounded-lg border border-border bg-card p-3 text-sm transition-colors',
                      device.status === 'failed' && 'border-destructive/30 opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        <StatusIcon status={device.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {device.model ?? device.friendlyName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {device.manufacturer ? `${device.manufacturer} · ` : ''}
                          {device.ieeeAddr}
                        </p>
                        {device.capabilities.length > 0 && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {device.capabilities.slice(0, 6).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <AppButton
                        size="sm"
                        className="w-full"
                        disabled={!houseId || !canSelect(device)}
                        onClick={() => void handleSelect(device)}
                      >
                        Настроить
                      </AppButton>
                      {device.status === 'failed' && (
                        <p className="mt-1 text-[11px] text-destructive">
                          {t('admin.accessControl.pairing.interviewFailed')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && isActive && devices.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">
                {t('admin.accessControl.pairing.waitingForDevices')}
              </p>
            </div>
          )}

          {step === 2 && selected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">
                  {selected.model ?? selected.friendlyName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {selected.manufacturer ? `${selected.manufacturer} · ` : ''}
                  {selected.ieeeAddr}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Название</p>
                <Input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Например: Датчик движения в прихожей"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Категория</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={categoryId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCategoryId(v ? Number(v) : null);
                  }}
                >
                  <option value="">Не выбрано</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categoriesError && (
                  <p className="text-[11px] text-destructive">{categoriesError}</p>
                )}
              </div>

              {saveError && <p className="text-[11px] text-destructive">{saveError}</p>}

              <AppButton
                onClick={() => void handleSave()}
                disabled={saving || !houseId || !selected.physicalDeviceId}
                className="w-full"
              >
                {saving ? 'Сохранение…' : 'Добавить устройство'}
              </AppButton>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                Рекомендуемые сценарии (заглушка). Здесь можно будет предложить готовые
                автоматизации для выбранного типа устройства.
              </div>
              <AppButton onClick={handleFinish} className="w-full">
                Готово
              </AppButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
