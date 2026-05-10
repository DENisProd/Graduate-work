'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ZigbeeStateWire } from '@/types/api';

function telemetryChangeSignature(live: ZigbeeStateWire | undefined): string {
  if (!live) return '';
  if (live.stateId) return `${live.stateId}:${live.timestamp}`;
  return `${live.timestamp}:${JSON.stringify(live.metrics)}`;
}

const TELEMETRY_PULSE_DEBOUNCE_MS = 180;
const TELEMETRY_FLASH_MS = 2200;

const TELEMETRY_CSS = `
  @property --ta {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
  }

  @keyframes telemetry-run {
    to { --ta: 1turn; }
  }

  /* Crisp running line — 2 px outside the card border. */
  [data-tr] {
    position: absolute;
    inset: -2px;
    border-radius: calc(0.75rem + 2px);
    padding: 2px;
    background: conic-gradient(
      from var(--ta),
      transparent 0%,
      transparent 54%,
      color-mix(in oklch, var(--tc, currentColor) 15%, transparent) 60%,
      color-mix(in oklch, var(--tc, currentColor) 60%, transparent) 66%,
      var(--tc, currentColor) 71%,
      hsl(0 0% 100% / 0.92) 75%,
      var(--tc, currentColor) 79%,
      color-mix(in oklch, var(--tc, currentColor) 55%, transparent) 86%,
      color-mix(in oklch, var(--tc, currentColor) 15%, transparent) 94%,
      transparent 99%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    animation: telemetry-run 1.5s linear infinite;
    pointer-events: none;
  }

  /* Blurred copy underneath creates the outer bloom. */
  [data-tr-blur] {
    position: absolute;
    inset: -2px;
    border-radius: calc(0.75rem + 2px);
    padding: 2px;
    background: conic-gradient(
      from var(--ta),
      transparent 0%,
      transparent 54%,
      color-mix(in oklch, var(--tc, currentColor) 15%, transparent) 60%,
      color-mix(in oklch, var(--tc, currentColor) 60%, transparent) 66%,
      var(--tc, currentColor) 71%,
      hsl(0 0% 100% / 0.92) 75%,
      var(--tc, currentColor) 79%,
      color-mix(in oklch, var(--tc, currentColor) 55%, transparent) 86%,
      color-mix(in oklch, var(--tc, currentColor) 15%, transparent) 94%,
      transparent 99%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    animation: telemetry-run 1.5s linear infinite;
    pointer-events: none;
    filter: blur(9px);
    opacity: 0.6;
  }

  /* Radial background glow — covers the card interior. */
  [data-tr-bg] {
    position: absolute;
    inset: 0;
    border-radius: 0.75rem;
    background: radial-gradient(
      ellipse 90% 80% at 50% 50%,
      color-mix(in oklch, var(--tc, transparent) 10%, transparent) 0%,
      transparent 65%
    );
    pointer-events: none;
  }
`;

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

    // If we started with "no telemetry" (empty signature) and then received the first payload,
    // treat it as initial load and do not pulse.
    if (prevSigRef.current === '' && sig !== '') {
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

export function TelemetryFlashOverlay({ pulseKey }: { pulseKey: number }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (pulseKey === 0) return;
    const el = overlayRef.current;
    const ring = ringRef.current;
    const blur = blurRef.current;
    const bg = bgRef.current;
    if (!el || !ring || !blur || !bg) return;

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    if (!primary) return;

    el.getAnimations().forEach((a) => a.cancel());
    bg.getAnimations().forEach((a) => a.cancel());

    ring.style.setProperty('--tc', primary);
    blur.style.setProperty('--tc', primary);
    bg.style.setProperty('--tc', primary);

    // Running ring: snap in, hold through most of the flash, fade out.
    const ringAnim = el.animate(
      [
        { opacity: '0' },
        { opacity: '1', offset: 0.05 },
        { opacity: '1', offset: 0.72 },
        { opacity: '0' },
      ],
      { duration: TELEMETRY_FLASH_MS, easing: 'ease-in-out', fill: 'forwards' }
    );

    // Background: single soft pulse — rises fast, lingers briefly, then fades.
    const bgAnim = bg.animate(
      [
        { opacity: '0' },
        { opacity: '1', offset: 0.10 },
        { opacity: '0.5', offset: 0.42 },
        { opacity: '0' },
      ],
      { duration: TELEMETRY_FLASH_MS, easing: 'ease-in-out', fill: 'forwards' }
    );

    return () => {
      ringAnim.cancel();
      bgAnim.cancel();
    };
  }, [pulseKey]);

  if (pulseKey === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TELEMETRY_CSS }} />
      {/* Background pulse sits below the ring. */}
      <div
        ref={bgRef}
        data-tr-bg
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ zIndex: 9 }}
        aria-hidden
      />
      {/* Ring + blurred bloom. */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
        style={{ willChange: 'opacity', overflow: 'visible' }}
        aria-hidden
      >
        <div ref={blurRef} data-tr-blur />
        <div ref={ringRef} data-tr />
      </div>
    </>
  );
}
