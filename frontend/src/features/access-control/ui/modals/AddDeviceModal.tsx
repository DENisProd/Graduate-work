'use client';

import { useEffect, useRef, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { physicalDevicesApi } from '@/lib/api-client';
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

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}

function formatTime(s: number) {
  return `${pad2(s / 60)}:${pad2(s % 60)}`;
}

// --- Device status icon ---
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
  // failed
  return (
    <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// --- Single discovered device card ---
function DeviceCard({
  device,
  houseId,
  onAdded,
  t,
}: {
  device: PairingDevice;
  houseId: string;
  onAdded: (ieeeAddr: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [name, setName] = useState(
    device.friendlyName.startsWith('0x') ? '' : device.friendlyName,
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!device.physicalDeviceId) return;
    setAdding(true);
    setError(null);
    try {
      await physicalDevicesApi.update(device.physicalDeviceId, {
        houseId,
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      setAdded(true);
      onAdded(device.ieeeAddr);
    } catch {
      setError(t('admin.accessControl.pairing.addError'));
    } finally {
      setAdding(false);
    }
  };

  const canAdd = device.status === 'done' && Boolean(device.physicalDeviceId) && !added;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-3 text-sm transition-colors',
        added && 'border-emerald-500/40 bg-emerald-500/5',
        device.status === 'failed' && 'border-destructive/30 opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={added ? 'done' : device.status} />
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

      {canAdd && (
        <div className="mt-2.5 space-y-2">
          <Input
            placeholder={t('admin.accessControl.pairing.deviceNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <AppButton
            size="sm"
            onClick={handleAdd}
            disabled={adding}
            className="w-full"
          >
            {adding
              ? t('admin.accessControl.pairing.adding')
              : t('admin.accessControl.pairing.addToHouse')}
          </AppButton>
        </div>
      )}

      {added && (
        <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          {t('admin.accessControl.pairing.addedSuccess')}
        </p>
      )}

      {device.status === 'failed' && (
        <p className="mt-1 text-[11px] text-destructive">
          {t('admin.accessControl.pairing.interviewFailed')}
        </p>
      )}
    </div>
  );
}

// --- Main modal ---
export function AddDeviceModal({
  isOpen,
  onOpenChange,
  houseId,
  onDeviceAdded,
  onClose,
}: AddDeviceModalProps) {
  const { t } = useTranslation();
  const [startError, setStartError] = useState<string | null>(null);
  const addedIeees = useRef(new Set<string>());

  const { isActive, isSocketConnected, timeLeft, devices, start, stop, clearDevices } = usePairing({
    enabled: isOpen,
  });

  // Clear local state when modal closes (stop() is handled by handleOpenChange)
  useEffect(() => {
    if (!isOpen && isActive) {
      clearDevices();
      addedIeees.current.clear();
    }
  }, [isOpen, isActive, clearDevices]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isActive) void stop();
      clearDevices();
      addedIeees.current.clear();
      setStartError(null);
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
    onDeviceAdded?.();
  };

  const progressPct = isActive ? (timeLeft / SEARCH_DURATION) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('admin.accessControl.pairing.title')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden">

          {/* Not connected warning */}
          {!isSocketConnected && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              {t('admin.accessControl.pairing.noSocket')}
            </div>
          )}

          {/* Idle state — show only when not searching AND no devices found yet */}
          {!isActive && devices.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.accessControl.pairing.description')}
              </p>

              {startError && (
                <p className="text-xs text-destructive">{startError}</p>
              )}

              <AppButton
                onClick={handleStart}
                disabled={!isSocketConnected}
                className="w-full"
              >
                {t('admin.accessControl.pairing.start')}
              </AppButton>
            </div>
          )}

          {/* Active pairing state — timer + stop button; hidden once time runs out */}
          {isActive && (
            <div className="space-y-3">
              {/* Timer bar */}
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

          {/* Discovered devices list */}
          {devices.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {t('admin.accessControl.pairing.found', { count: devices.length })}
              </p>
              <div className="space-y-2">
                {devices.map((device) => (
                  houseId ? (
                    <DeviceCard
                      key={device.ieeeAddr}
                      device={device}
                      houseId={houseId}
                      onAdded={handleDeviceAdded}
                      t={t}
                    />
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Empty state while active */}
          {isActive && devices.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">
                {t('admin.accessControl.pairing.waitingForDevices')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
