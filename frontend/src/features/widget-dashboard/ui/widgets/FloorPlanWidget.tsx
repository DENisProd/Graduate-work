'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { HouseFloorPlanConfig } from '../../types/widget.types';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { houseFloorPlansApi } from '@/lib/api/scenario-service';
import type { Room } from '@/domain/room-planner';
import { useTranslation } from '@/hooks';

const FloorPlanReadonlyCanvas = dynamic(
  () =>
    import('./FloorPlanReadonlyCanvas').then((mod) => ({
      default: mod.FloorPlanReadonlyCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    ),
  },
);

interface Props {
  config: HouseFloorPlanConfig;
  deviceMap: Record<string, PhysicalDeviceResponse>;
  states: Map<string, ZigbeeStateWire>;
}

export function FloorPlanWidget({ config, deviceMap, states }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    houseFloorPlansApi
      .get(config.houseId)
      .then((plan) => {
        if (cancelled) return;
        setRoom(plan.snapshot.room as unknown as Room);
      })
      .catch((e) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : '';
        if (message.includes('404') || message.toLowerCase().includes('not found')) {
          setRoom({ walls: [], devices: [], doors: [], windows: [] });
        } else {
          setError(message || t('dashboard.overview.widgets.floorPlanLoadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config.houseId, t]);

  const hasLayout = (room?.walls.length ?? 0) > 0 || (room?.devices.length ?? 0) > 0;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-muted/20">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : !hasLayout ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {t('dashboard.overview.widgets.floorPlanEmptyTitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.overview.widgets.floorPlanEmptyHint')}
          </p>
        </div>
      ) : (
        <FloorPlanReadonlyCanvas
          room={room!}
          deviceMap={deviceMap}
          states={states}
          width={size.width}
          height={size.height}
          showDeviceLabels={config.showDeviceLabels}
          showMetrics={config.showMetrics}
        />
      )}
    </div>
  );
}
