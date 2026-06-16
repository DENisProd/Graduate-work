import { useEffect, useState } from 'react';

const OVERVIEW_MS = 5000;
const FOCUS_MS = 5000;

export type FloorPlanSlideshowPhase = 'overview' | 'focus';

export function useFloorPlanSlideshow(deviceCount: number, enabled: boolean) {
  const [phase, setPhase] = useState<FloorPlanSlideshowPhase>('overview');
  const [deviceIndex, setDeviceIndex] = useState(0);

  useEffect(() => {
    if (!enabled || deviceCount === 0) {
      setPhase('overview');
      setDeviceIndex(0);
      return;
    }

    const delay = phase === 'overview' ? OVERVIEW_MS : FOCUS_MS;
    const timer = window.setTimeout(() => {
      if (phase === 'overview') {
        setPhase('focus');
        setDeviceIndex(0);
        return;
      }

      if (deviceIndex + 1 >= deviceCount) {
        setPhase('overview');
        setDeviceIndex(0);
        return;
      }

      setDeviceIndex((index) => index + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [deviceCount, deviceIndex, enabled, phase]);

  return { phase, deviceIndex };
}
