import { useEffect, useRef, useState } from 'react';

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function useAnimatedViewport(target: Viewport, durationMs = 800): Viewport {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const from = currentRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const next: Viewport = {
        scale: from.scale + (target.scale - from.scale) * eased,
        offsetX: from.offsetX + (target.offsetX - from.offsetX) * eased,
        offsetY: from.offsetY + (target.offsetY - from.offsetY) * eased,
      };
      setCurrent(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target.scale, target.offsetX, target.offsetY, durationMs]);

  return current;
}
