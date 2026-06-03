'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { zigbeeTelemetryManager } from '../lib/zigbee-telemetry-manager';
import type { ZigbeePairingEvent, ZigbeePairingStatus } from '../lib/zigbee-telemetry-manager';

export type PairingDeviceStatus = 'joining' | 'interviewing' | 'done' | 'failed';

export interface PairingDevice {
  ieeeAddr: string;
  friendlyName: string;
  status: PairingDeviceStatus;
  supported: boolean;
  physicalDeviceId: string | null;
  model: string | null;
  manufacturer: string | null;
  capabilities: string[];
}

interface UsePairingOptions {
  enabled: boolean;
  houseId: string | null;
}

export interface UsePairingResult {
  isActive: boolean;
  isSocketConnected: boolean;
  timeLeft: number;
  devices: PairingDevice[];
  start: (time?: number) => Promise<{ ok: boolean; error?: string }>;
  stop: () => Promise<void>;
  clearDevices: () => void;
}

export function usePairing({ enabled, houseId }: UsePairingOptions): UsePairingResult {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [devices, setDevices] = useState<PairingDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    setDevices([]);
    zigbeeTelemetryManager.acquire();
    setIsConnected(zigbeeTelemetryManager.isConnected());

    const unsub = zigbeeTelemetryManager.subscribeConnection(() => {
      const connected = zigbeeTelemetryManager.isConnected();
      setIsConnected(connected);
      // Re-join pairing room after reconnect only if pairing is active.
      if (connected && activeRef.current) void zigbeeTelemetryManager.watchPairing();
    });

    return () => {
      unsub();
      void zigbeeTelemetryManager.unwatchPairing();
      zigbeeTelemetryManager.release();
    };
  }, [enabled]);

  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsActive(false);
          activeRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const offEvent = zigbeeTelemetryManager.onPairingEvent((event: ZigbeePairingEvent) => {
      if (!activeRef.current) return;
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.ieeeAddr === event.ieeeAddr);
        const next: PairingDevice = {
          ieeeAddr: event.ieeeAddr,
          friendlyName: event.friendlyName,
          status: mapEventType(event.type),
          supported: event.supported ?? false,
          physicalDeviceId: event.physicalDeviceId ?? null,
          model: event.model ?? null,
          manufacturer: event.manufacturer ?? null,
          capabilities: event.capabilities ?? [],
        };
        if (idx === -1) return [...prev, next];
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...next };
        return updated;
      });
    });

    const offStatus = zigbeeTelemetryManager.onPairingStatus((status: ZigbeePairingStatus) => {
      if (status.permitJoin && activeRef.current) {
        if (status.timeout != null && status.timeout > 0) {
          startCountdown(status.timeout);
        }
      } else if (!status.permitJoin && activeRef.current) {
        // Only stop the countdown/active state if WE started it.
        // Ignoring retained bridge/state messages that arrive before or
        // after our own pairing session prevents spurious deactivation.
        if (timerRef.current) clearInterval(timerRef.current);
        setIsActive(false);
        activeRef.current = false;
        setTimeLeft(0);
      }
    });

    return () => {
      offEvent();
      offStatus();
    };
  }, [enabled, startCountdown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback(
    async (time = 254) => {
      if (!isConnected) return { ok: false, error: 'Socket not connected' };
      if (!houseId) return { ok: false, error: 'houseId required' };
      const result = await zigbeeTelemetryManager.startPairing(houseId, time);
      if (result.ok) {
        setDevices([]);
        setIsActive(true);
        activeRef.current = true;
        startCountdown(time);
        void zigbeeTelemetryManager.watchPairing();
      }
      return result;
    },
    [houseId, isConnected, startCountdown],
  );

  const stop = useCallback(async () => {
    if (houseId) await zigbeeTelemetryManager.stopPairing(houseId);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    activeRef.current = false;
    setTimeLeft(0);
  }, [houseId]);

  const clearDevices = useCallback(() => setDevices([]), []);

  return { isActive, isSocketConnected: isConnected, timeLeft, devices, start, stop, clearDevices };
}

function mapEventType(type: ZigbeePairingEvent['type']): PairingDeviceStatus {
  switch (type) {
    case 'joined': return 'joining';
    case 'interview_started': return 'interviewing';
    case 'interview_done': return 'done';
    case 'interview_failed': return 'failed';
  }
}
