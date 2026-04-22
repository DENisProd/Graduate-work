'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ZigbeeStateWire } from '@/types/api';

function telemetryChangeSignature(live: ZigbeeStateWire | undefined): string {
  if (!live) return '';
  if (live.stateId) return `${live.stateId}:${live.timestamp}`;
  return `${live.timestamp}:${JSON.stringify(live.metrics)}`;
}

const TELEMETRY_PULSE_DEBOUNCE_MS = 180;
const TELEMETRY_FLASH_MS = 2000;

/** Debounced pulse key — MQTT пачки не обрывают 2 s анимацию. */
export function useTelemetryPulseKey(live: ZigbeeStateWire | undefined): number {
  const [pulseKey, setPulseKey] = useState(0);
  const prevSigRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const sig = telemetryChangeSignature(live);

    if (prevSigRef.current === null) {
      prevSigRef.current = sig;
      return;
    }

    if (sig !== prevSigRef.current && sig !== '') {
      prevSigRef.current = sig;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        setPulseKey((k) => k + 1);
      }, TELEMETRY_PULSE_DEBOUNCE_MS);
      return;
    }

    prevSigRef.current = sig;
  }, [live]);

  return pulseKey;
}

/** WAAPI-анимация вспышки по периметру карточки при изменении телеметрии. */
export function TelemetryFlashOverlay({ pulseKey }: { pulseKey: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (pulseKey === 0) return;
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim();
    if (!accent) return;

    el.getAnimations().forEach((a) => a.cancel());

    const ring = `inset 0 0 0 2px ${accent}, 0 0 0 2px ${accent}`;
    const glowStrong = `${ring}, 0 0 36px 10px ${accent}`;
    const glowSoft = `${ring}, 0 0 24px 6px ${accent}`;

    const anim = el.animate(
      [
        { opacity: 0, boxShadow: 'inset 0 0 0 0 transparent, 0 0 0 0 transparent' },
        { opacity: 1, boxShadow: glowStrong, offset: 0.1 },
        { opacity: 1, boxShadow: glowSoft, offset: 0.72 },
        { opacity: 0, boxShadow: 'inset 0 0 0 0 transparent, 0 0 0 0 transparent' },
      ],
      {
        duration: TELEMETRY_FLASH_MS,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
        fill: 'forwards',
      }
    );

    return () => anim.cancel();
  }, [pulseKey]);

  if (pulseKey === 0) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      style={{ willChange: 'opacity, box-shadow' }}
      aria-hidden
    />
  );
}
