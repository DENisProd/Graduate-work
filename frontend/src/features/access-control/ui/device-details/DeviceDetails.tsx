'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, physicalDevicesApi, deviceDataApi, deviceTypesApi, devicesApi } from '@/lib/api-client';
import type { PhysicalDeviceResponse, DeviceDataResponse, DeviceDataSeriesResponse } from '@/types/api';
import { connectivityFromLastOnline, connectivityLabel, type ConnectivityStatus } from '@/lib/device-connectivity';
import { Chart, type AxisOptions } from 'react-charts';
import { parseLocalServerDeviceId } from '@/features/access-control/lib/local-server-device';
import { getDisplayName } from '@/features/access-control/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDateTime } from '@/lib/utils';
import { LocalServerDetails } from './LocalServerDetails';
import { DeviceEditModal } from './DeviceEditModal';

interface DeviceDetailsProps {
  houseId: string;
  deviceId: string;
  backHref?: string;
  backLabel?: string;
  canRefreshData?: boolean;
}

function displayName(device: PhysicalDeviceResponse | null): string {
  if (!device) return '';
  const n = device.name || device.friendlyName || device.protocolAddress || device.id;
  return typeof n === 'string' ? n : String(n);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function DeviceTypeIcon({ type }: { type?: string | null }) {
  if (type === 'Coordinator') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  }
  if (type === 'Router') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="8" width="20" height="8" rx="2" />
        <path d="M6 12h.01M10 12h.01M14 12h.01" strokeLinecap="round" />
        <path d="M8 8V6a4 4 0 018 0v2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-8" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M9 10v10M15 10v10" />
    </svg>
  );
}

function StatusDot({ status }: { status?: string }) {
  const cls =
    status === 'ONLINE'
      ? 'bg-emerald-500'
      : status === 'ERROR'
        ? 'bg-destructive'
        : status === 'UNKNOWN'
          ? 'bg-yellow-500'
          : 'bg-muted-foreground/50';
  return <span className={cn('inline-flex size-2 shrink-0 rounded-full', cls)} aria-hidden />;
}

const FIELD_ICONS: Record<string, () => React.ReactElement> = {
  id: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
      <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm4 3a1 1 0 100 2 1 1 0 000-2zm-1 4v2h2V9H7z" />
    </svg>
  ),
  network: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
      <path d="M8 1a2.5 2.5 0 010 5 2.5 2.5 0 010-5zm-5 9a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0zM8 8a1 1 0 00-1 1v.5a2.5 2.5 0 000 5h2a2.5 2.5 0 000-5V9a1 1 0 00-1-1z" />
    </svg>
  ),
  hardware: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
      <path d="M5 1h6l2 2v10l-2 2H5l-2-2V3l2-2zm0 1L3 4v8l2 2h6l2-2V4l-2-2H5zm3 2a3 3 0 110 6 3 3 0 010-6z" />
    </svg>
  ),
  time: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7.5 4v4.25l3.25 1.95-.75 1.25L6 9V4h1.5z" />
    </svg>
  ),
};

const FIELD_GROUPS: Array<{
  key: 'identity' | 'network' | 'hardware' | 'location' | 'timestamps';
  fields: Array<{
    labelKey: string;
    key: keyof PhysicalDeviceResponse;
    icon: keyof typeof FIELD_ICONS;
  }>;
}> = [
  {
    key: 'identity',
    fields: [
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.id', key: 'id', icon: 'id' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.friendlyName', key: 'friendlyName', icon: 'id' },
    ],
  },
  {
    key: 'network',
    fields: [
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.protocolAddress', key: 'protocolAddress', icon: 'network' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.networkAddress', key: 'networkAddress', icon: 'network' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.ipAddress', key: 'ipAddress', icon: 'network' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.macAddress', key: 'macAddress', icon: 'network' },
    ],
  },
  {
    key: 'hardware',
    fields: [
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.manufacturerName', key: 'manufacturerName', icon: 'hardware' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.model', key: 'model', icon: 'hardware' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.firmwareVersion', key: 'firmwareVersion', icon: 'hardware' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.serialNumber', key: 'serialNumber', icon: 'hardware' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.description', key: 'description', icon: 'hardware' },
    ],
  },
  {
    key: 'location',
    fields: [
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.houseId', key: 'houseId', icon: 'id' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.roomId', key: 'roomId', icon: 'id' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.deviceType', key: 'deviceTypeId', icon: 'id' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.deviceCatalog', key: 'deviceId', icon: 'id' },
    ],
  },
  {
    key: 'timestamps',
    fields: [
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.lastSeen', key: 'lastSeen', icon: 'time' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.createdAt', key: 'createdAt', icon: 'time' },
      { labelKey: 'admin.accessControl.connectedDevices.deviceDetails.fields.updatedAt', key: 'updatedAt', icon: 'time' },
    ],
  },
];

const GROUP_LABEL_KEYS: Record<(typeof FIELD_GROUPS)[number]['key'], string> = {
  identity: 'admin.accessControl.connectedDevices.deviceDetails.groups.identity',
  network: 'admin.accessControl.connectedDevices.deviceDetails.groups.network',
  hardware: 'admin.accessControl.connectedDevices.deviceDetails.groups.hardware',
  location: 'admin.accessControl.connectedDevices.deviceDetails.groups.location',
  timestamps: 'admin.accessControl.connectedDevices.deviceDetails.groups.timestamps',
};

function CollapsibleJson({
  title,
  json,
  labels,
}: {
  title: string;
  json: string;
  labels: {
    lines: (count: number) => string;
    jsonLang: string;
    copy: string;
    copied: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center rounded-md bg-muted p-1"
            aria-hidden
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3.5 text-muted-foreground">
              <path d="M4 3L1 7l3 4M10 3l3 4-3 4M8 1l-2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {labels.lines(json.split('\n').length)}
          </span>
        </div>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">{labels.jsonLang}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3">
                    <path d="M2 7l3 3 7-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {labels.copied}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3">
                    <rect x="4" y="4" width="8" height="8" rx="1" />
                    <path d="M2 10V2h8" strokeLinecap="round" />
                  </svg>
                  {labels.copy}
                </>
              )}
            </button>
          </div>
          <pre className="max-h-[min(70vh,34rem)] overflow-auto px-4 pb-5 font-mono text-xs leading-relaxed text-foreground/80">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}


type TimeRange = '1m' | '1h' | '6h' | '24h' | '7d' | 'all';

const HISTORY_LIMIT = 25;

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '1m', label: '1m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: 'all', label: '∞' },
];

function deviceDataSeriesKey(capability: string, attribute?: string | null): string {
  return `${capability}:${attribute ?? ''}`;
}

function seriesKeyLabel(key: string): string {
  const i = key.indexOf(':');
  if (i < 0) return key;
  const cap = key.slice(0, i);
  const attr = key.slice(i + 1).trimEnd();
  return attr.length > 0 ? `${cap}.${attr}` : cap;
}

function seriesKeyCapabilityPart(key: string): string {
  const i = key.indexOf(':');
  return i >= 0 ? key.slice(0, i) : key;
}

function getFromDate(range: TimeRange): Date | undefined {
  if (range === 'all') return undefined;
  const MS: Record<Exclude<TimeRange, 'all'>, number> = {
    '1m': 60_000, '1h': 3_600_000, '6h': 21_600_000, '24h': 86_400_000, '7d': 604_800_000,
  };
  return new Date(Date.now() - MS[range]);
}

function formatHistoryValue(value: unknown, unit?: string | null, type?: string): string {
  if (value === null || value === undefined) return '—';
  const u = unit ? ` ${unit}` : '';
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
  if (typeof value === 'number') {
    return `${type === 'FLOAT' ? value.toFixed(2) : String(value)}${u}`;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if ('on' in o && typeof o.on === 'boolean') return o.on ? `ON${u}` : `OFF${u}`;
    if ('value' in o) {
      const v = o.value;
      const unitFromValue = typeof o.unit === 'string' && o.unit ? ` ${o.unit}` : '';
      if (typeof v === 'number') {
        return `${type === 'FLOAT' ? v.toFixed(2) : String(v)}${unitFromValue || u}`;
      }
      if (typeof v === 'boolean') return v ? `ON${unitFromValue || u}` : `OFF${unitFromValue || u}`;
      if (typeof v === 'string') return `${v}${unitFromValue || u}`;
    }
    try {
      return `${JSON.stringify(o)}${u}`;
    } catch {
      return `${String(o)}${u}`;
    }
  }
  return `${String(value)}${u}`;
}

function filterChipClass(active: boolean) {
  return active
    ? 'border-border bg-muted text-foreground'
    : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground';
}

type HistoryPoint = { ts: number; value: number };

function historyNumber(value: unknown): number | null {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const s = value.trim().toLowerCase();
    if (['on', 'true', 'yes'].includes(s)) return 1;
    if (['off', 'false', 'no'].includes(s)) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (typeof o.on === 'boolean') return o.on ? 1 : 0;
    if (typeof o.value === 'number' && Number.isFinite(o.value)) return o.value;
    if (typeof o.value === 'string' && o.value.trim() !== '') {
      const sv = o.value.trim().toLowerCase();
      if (['on', 'true', 'yes'].includes(sv)) return 1;
      if (['off', 'false', 'no'].includes(sv)) return 0;
      const n = Number(o.value);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function isBinarySeries(points: HistoryPoint[]): boolean {
  if (points.length === 0) return false;
  for (const p of points) {
    if (p.value !== 0 && p.value !== 1) return false;
  }
  return true;
}

function downsampleUniform(points: HistoryPoint[], maxPoints: number): HistoryPoint[] {
  if (points.length <= maxPoints) return points;
  if (maxPoints <= 2) return [points[0], points[points.length - 1]];
  const out: HistoryPoint[] = [];
  const n = points.length;
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round((i * (n - 1)) / (maxPoints - 1));
    const p = points[Math.min(n - 1, Math.max(0, idx))];
    if (out.length === 0 || out[out.length - 1].ts !== p.ts) out.push(p);
  }
  const last = points[n - 1];
  if (out[out.length - 1]?.ts !== last.ts) out.push(last);
  return out;
}

function compactBinaryTransitions(points: HistoryPoint[]): HistoryPoint[] {
  if (points.length <= 2) return points;
  const out: HistoryPoint[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = points[i];
    if (cur.value !== prev.value) out.push(cur);
  }
  const last = points[points.length - 1];
  if (out[out.length - 1].ts !== last.ts) out.push(last);
  return out;
}

function toStepPoints(points: HistoryPoint[]): HistoryPoint[] {
  if (points.length < 2) return points;
  const out: HistoryPoint[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const cur = points[i];
    const next = points[i + 1];
    out.push(cur);
    if (next) {
      out.push({ ts: next.ts, value: cur.value });
    }
  }
  return out;
}

type ChartDatum = { ts: Date; value: number };

function HistoryLineChart({
  title,
  unit,
  series,
}: {
  title: string;
  unit?: string | null;
  series: Array<{ label: string; points: HistoryPoint[] }>;
}) {
  const flat = useMemo(() => series.flatMap((s) => s.points), [series]);
  const last = flat[flat.length - 1];

  const yDomain = useMemo(() => {
    if (flat.length === 0) return { hardMin: undefined as number | undefined, hardMax: undefined as number | undefined };
    const values = flat.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const isBinary = values.every((v) => v === 0 || v === 1);
    if (isBinary) return { hardMin: 0, hardMax: 1 };
    if (lo === hi) {
      const pad = lo === 0 ? 1 : Math.abs(lo) * 0.1 || 1;
      return { hardMin: lo - pad, hardMax: hi + pad };
    }
    return { hardMin: undefined, hardMax: undefined };
  }, [flat]);

  const data = useMemo(() => {
    return series.map((s) => ({
      label: s.label,
      data: s.points.map((p) => ({ ts: new Date(p.ts), value: p.value })),
    }));
  }, [series]);

  const primaryAxis = useMemo((): AxisOptions<ChartDatum> => {
    return {
      getValue: (d) => d.ts,
      scaleType: 'time',
    };
  }, []);

  const secondaryAxes = useMemo((): AxisOptions<ChartDatum>[] => {
    return [
      {
        getValue: (d) => d.value,
        elementType: 'line',
        ...(yDomain.hardMin !== undefined ? { hardMin: yDomain.hardMin } : {}),
        ...(yDomain.hardMax !== undefined ? { hardMax: yDomain.hardMax } : {}),
        tickCount: 4,
      },
    ];
  }, [yDomain]);

  const { min, max } = useMemo(() => {
    if (flat.length === 0) return { min: 0, max: 0 };
    const values = flat.map((p) => p.value);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [flat]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {flat.length} {flat.length === 1 ? 'точка' : 'точек'}
          </p>
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {last ? last.value.toFixed(1) : '—'}
          </span>
          {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        </div>
      </div>

      <div className="relative h-28 px-5 py-3">
        {flat.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
            Недостаточно данных для графика
          </div>
        ) : (
          <Chart
            options={{
              data,
              primaryAxis,
              secondaryAxes,
            }}
          />
        )}
      </div>

      {flat.length >= 2 ? (
        <div className="flex justify-between px-5 pb-3 text-[10px] text-muted-foreground">
          <span>
            min {min.toFixed(1)}
            {unit ?? ''}
          </span>
          <span>
            max {max.toFixed(1)}
            {unit ?? ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function DeviceHistorySection({
  deviceId,
  canRefreshData = true,
}: {
  deviceId: string;
  canRefreshData?: boolean;
}) {
  const { t, locale } = useTranslation();
  const tx = useCallback(
    (key: string, opts?: Record<string, unknown>) => t(key as never, opts as never),
    [t],
  );

  const [items, setItems] = useState<DeviceDataResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedCaps, setSelectedCaps] = useState<string[]>(['all']);

  const [chartSeries, setChartSeries] = useState<DeviceDataSeriesResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartLoadingMore, setChartLoadingMore] = useState(false);

  const capabilitiesForSeriesApi = useMemo(() => {
    if (selectedCaps.includes('all')) return undefined;
    const caps = new Set<string>();
    for (const key of selectedCaps) caps.add(seriesKeyCapabilityPart(key));
    return Array.from(caps);
  }, [selectedCaps]);

  const chartRange = timeRange === 'all' ? ('7d' as const) : (timeRange as Exclude<TimeRange, 'all'>);

  const chartSeriesFiltered = useMemo(() => {
    const raw = chartSeries?.series ?? [];
    if (selectedCaps.includes('all')) return raw;
    const sel = new Set(selectedCaps);
    return raw.filter((s) => sel.has(s.key));
  }, [chartSeries, selectedCaps]);

  const chart = useMemo(() => {
    const resp = chartSeries;
    const rawSeries = chartSeriesFiltered;
    const series = rawSeries.map((s) => ({
      label: s.attribute ? `${s.capability}.${s.attribute}` : s.capability,
      points: s.points.map((p) => ({ ts: Date.parse(p.ts), value: p.value })).filter((p) => Number.isFinite(p.ts)),
    }));
    const unit =
      !selectedCaps.includes('all') && selectedCaps.length === 1
        ? rawSeries.find((s) => s.key === selectedCaps[0])?.unit ?? null
        : null;
    const title = tx('admin.accessControl.connectedDevices.deviceDetails.history.title');
    return { series, unit, title, from: resp?.from ?? null, to: resp?.to ?? null };
  }, [chartSeries, chartSeriesFiltered, selectedCaps, tx]);

  const seriesKeys = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((i) => seen.add(deviceDataSeriesKey(i.capability, i.attribute)));
    (chartSeries?.series ?? []).forEach((s) => seen.add(s.key));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [items, chartSeries]);

  const visibleItems = useMemo(() => {
    if (selectedCaps.includes('all')) return items;
    const set = new Set(selectedCaps);
    return items.filter((i) => set.has(deviceDataSeriesKey(i.capability, i.attribute)));
  }, [items, selectedCaps]);

  const doFetch = useCallback(
    async (p: number, reset: boolean, signal?: AbortSignal) => {
      if (reset) setLoading(true); else setLoadingMore(true);
      try {
        const from = getFromDate(timeRange);
        const res = await deviceDataApi.getAll({
          deviceId,
          ...(from ? { from } : {}),
          page: p,
          limit: HISTORY_LIMIT,
          signal,
        });
        if (signal?.aborted) return;
        setTotal(res.total);
        setItems((prev) => reset ? res.items : [...prev, ...res.items]);
        setPage(p);
      } catch {
        // ignore aborts / network errors — keep whatever was loaded
      } finally {
        if (!signal?.aborted) { setLoading(false); setLoadingMore(false); }
      }
    },
    [deviceId, timeRange],
  );

  const fetchChart = useCallback(
    async (opts: { reset: boolean; to?: string; signal?: AbortSignal }) => {
      const { reset, to, signal } = opts;
      if (reset) setChartLoading(true);
      else setChartLoadingMore(true);
      try {
        const resp = await deviceDataApi.getSeries({
          deviceId,
          range: chartRange,
          ...(capabilitiesForSeriesApi ? { capabilities: capabilitiesForSeriesApi } : {}),
          ...(to ? { to } : {}),
          signal,
        });
        if (signal?.aborted) return;
        setChartSeries((prev) => {
          if (reset || !prev) return resp;
          // Merge: prepend older points, keep uniqueness by ts per series key
          const byKey = new Map(prev.series.map((s) => [s.key, s]));
          for (const inc of resp.series) {
            const existing = byKey.get(inc.key);
            if (!existing) {
              byKey.set(inc.key, inc);
              continue;
            }
            const seen = new Set(existing.points.map((p) => p.ts));
            const merged = [...inc.points.filter((p) => !seen.has(p.ts)), ...existing.points];
            byKey.set(inc.key, { ...existing, points: merged });
          }
          const mergedFrom = resp.from;
          return { from: mergedFrom, to: prev.to, series: [...byKey.values()] };
        });
      } catch {
        // ignore
      } finally {
        if (!signal?.aborted) {
          setChartLoading(false);
          setChartLoadingMore(false);
        }
      }
    },
    [deviceId, chartRange, capabilitiesForSeriesApi],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void doFetch(1, true, ctrl.signal);
    // Reset chart immediately when range/capabilities change to avoid mixing windows.
    setChartSeries(null);
    void fetchChart({ reset: true, signal: ctrl.signal });
    return () => ctrl.abort();
  }, [doFetch, fetchChart]);

  const handleLoadMore = () => {
    void doFetch(page + 1, false);
    if (chart.from) void fetchChart({ reset: false, to: chart.from });
  };
  const hasMore = items.length < total;

  const histKey = 'admin.accessControl.connectedDevices.deviceDetails.history';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3">
        <span className="text-sm font-medium text-foreground">{tx(`${histKey}.title`)}</span>
        {total > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {tx(`${histKey}.total`, { count: total })}
          </span>
        )}
        {canRefreshData ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => void doFetch(1, true)}
            disabled={loading}
            className="ml-auto text-muted-foreground"
          >
            <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
            {tx(`${histKey}.refresh`)}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-2.5">
        <div className="flex items-center gap-0.5">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTimeRange(value); }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                timeRange === value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {value === 'all' ? tx(`${histKey}.filterAll`) : label}
            </button>
          ))}
        </div>

        {/* One tab per metric (capability:attribute); show even для одной метрики (раньше пропадало при единственном capability). */}
        {seriesKeys.length > 0 && (
          <>
            <span className="h-3 w-px shrink-0 bg-border" />
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedCaps(['all'])}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  filterChipClass(selectedCaps.includes('all')),
                )}
              >
                {tx(`${histKey}.allCapabilities`)}
              </button>
              {seriesKeys.map((seriesKey) => (
                <button
                  key={seriesKey}
                  type="button"
                  onClick={() =>
                    setSelectedCaps((prev) => {
                      const next = new Set(prev.includes('all') ? [] : prev);
                      if (next.has(seriesKey)) next.delete(seriesKey);
                      else next.add(seriesKey);
                      const arr = [...next];
                      return arr.length === 0 ? ['all'] : arr;
                    })
                  }
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors',
                    filterChipClass(!selectedCaps.includes('all') && selectedCaps.includes(seriesKey)),
                  )}
                >
                  {seriesKeyLabel(seriesKey)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
            <span className="text-[11px] text-muted-foreground">{tx(`${histKey}.loading`)}</span>
          </div>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-12">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="size-10 text-muted-foreground/40">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-muted-foreground">
            {!selectedCaps.includes('all')
              ? tx(`${histKey}.emptyFilter`)
              : tx(`${histKey}.empty`)}
          </p>
        </div>
      ) : (
        <>
          {chartLoading ? (
            <div className="px-5 pt-4 text-[11px] text-muted-foreground">Загрузка графика…</div>
          ) : chart.series.some((s) => s.points.length >= 2) ? (
            <div className="px-5 pt-4">
              <HistoryLineChart title={chart.title} unit={chart.unit} series={chart.series} />
            </div>
          ) : null}
          <div className="divide-y divide-border">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/30"
              >
                <Badge variant="outline" className="hidden shrink-0 text-[9px] uppercase sm:inline-flex">
                  {item.capability}
                </Badge>

                <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                  {item.attribute ?? item.capability}
                </span>

                <span className="flex-1 font-mono text-sm text-foreground">
                  {formatHistoryValue(item.value, item.unit, item.type)}
                </span>

                <time
                  dateTime={item.timestamp}
                  className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                >
                  {formatDateTime(item.timestamp, locale)}
                </time>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-40"
              >
                {loadingMore && (
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3 animate-spin">
                    <path d="M10 6A4 4 0 112 6" strokeLinecap="round" />
                  </svg>
                )}
                {tx(`${histKey}.loadMore`)}
                <span className="font-mono text-muted-foreground">{total - items.length}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


export function DeviceDetails({
  houseId,
  deviceId,
  backHref,
  backLabel,
  canRefreshData = true,
}: DeviceDetailsProps) {
  const localServerId = parseLocalServerDeviceId(deviceId);

  if (localServerId) {
    return (
      <LocalServerDetails
        houseId={houseId}
        serverId={localServerId}
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  return (
    <PhysicalDeviceDetails
      houseId={houseId}
      deviceId={deviceId}
      backHref={backHref}
      backLabel={backLabel}
      canRefreshData={canRefreshData}
    />
  );
}

function PhysicalDeviceDetails({
  houseId,
  deviceId,
  backHref,
  backLabel,
  canRefreshData = true,
}: DeviceDetailsProps) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const tx = useCallback(
    (key: string, options?: Record<string, unknown>) => t(key as never, options as never),
    [t]
  );

  const [device, setDevice] = useState<PhysicalDeviceResponse | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [error, setError] = useState<'none' | 'forbidden' | 'error'>('none');
  const [editOpen, setEditOpen] = useState(false);
  const [deviceTypeLabel, setDeviceTypeLabel] = useState<string | null>(null);
  const [catalogDeviceLabel, setCatalogDeviceLabel] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push('/login');
          return;
        }
        if (err.status === 403) {
          showToast(t('errors.unauthorized'), 'error');
          setError('forbidden');
          return;
        }
        if (err.status >= 500) {
          showToast(t('common.error'), 'error');
          setError('error');
          return;
        }
      }
      showToast(t('common.error'), 'error');
      setError('error');
    },
    [router, showToast, t]
  );

  const loadDevice = useCallback(
    async (signal?: AbortSignal) => {
      setDeviceLoading(true);
      setError('none');
      try {
        const res = await physicalDevicesApi.getById(deviceId, { signal });
        if (signal?.aborted) return;
        setDevice(res);
      } catch (err) {
        if (signal?.aborted) return;
        handleError(err);
      } finally {
        if (!signal?.aborted) setDeviceLoading(false);
      }
    },
    [deviceId, handleError]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDevice(controller.signal);
    return () => controller.abort();
  }, [loadDevice]);

  useEffect(() => {
    if (!device?.deviceTypeId) {
      setDeviceTypeLabel(null);
      return;
    }
    let cancelled = false;
    void deviceTypesApi
      .getById(device.deviceTypeId)
      .then((dt) => {
        if (cancelled) return;
        setDeviceTypeLabel(getDisplayName(dt.translations, dt.name, dt.code, locale));
      })
      .catch(() => {
        if (!cancelled) setDeviceTypeLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [device?.deviceTypeId, locale]);

  useEffect(() => {
    const rawId = device?.deviceId;
    if (rawId == null || rawId === '') {
      setCatalogDeviceLabel(null);
      return;
    }
    const catalogId = typeof rawId === 'number' ? rawId : Number(rawId);
    if (!Number.isFinite(catalogId)) {
      setCatalogDeviceLabel(null);
      return;
    }
    let cancelled = false;
    void devicesApi
      .getById(catalogId)
      .then((d) => {
        if (cancelled) return;
        setCatalogDeviceLabel(getDisplayName(d.translations, d.name, d.code, locale));
      })
      .catch(() => {
        if (!cancelled) setCatalogDeviceLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [device?.deviceId, locale]);

  const definitionJson = useMemo(() => {
    if (!device?.definition) return '';
    try {
      return JSON.stringify(device.definition, null, 2);
    } catch {
      return String(device.definition);
    }
  }, [device]);

  const fullDeviceJson = useMemo(() => {
    if (!device) return '';
    try {
      return JSON.stringify(device, null, 2);
    } catch {
      return '';
    }
  }, [device]);

  const baseStatus = device?.status;
  const derivedConnectivity: ConnectivityStatus | null = device?.lastSeen
    ? connectivityFromLastOnline(device.lastSeen)
    : null;
  const status: string | undefined =
    baseStatus === 'ERROR' ? 'ERROR' : (derivedConnectivity ?? (baseStatus ?? undefined));
  const defaultBackHref = `/admin/access-control/houses/${houseId}`;
  const resolvedBackHref = backHref ?? defaultBackHref;
  const resolvedBackLabel = backLabel ?? t('admin.accessControl.connectedDevices.backToDevices');

  const statusLabel =
    status === 'ONLINE'
      ? t('admin.status.online')
      : status === 'ERROR'
        ? 'ERROR'
        : status === 'OFFLINE'
          ? t('admin.status.offline')
          : status === 'UNKNOWN'
            ? connectivityLabel('UNKNOWN', 'ru')
            : null;

  const statusBadgeClass =
    status === 'ONLINE'
      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
      : status === 'ERROR'
        ? 'border-destructive/40 text-destructive'
        : status === 'UNKNOWN'
          ? 'border-yellow-500/40 text-yellow-600 dark:text-yellow-400'
          : 'border-border text-muted-foreground';

  const fieldGroupsWithEntries = FIELD_GROUPS.map((group) => ({
    group,
    entries: group.fields
      .filter((f) => f.key !== 'name')
      .map((f) => ({
        fieldKey: f.key,
        label: tx(f.labelKey),
        value: device?.[f.key],
        icon: f.icon,
      }))
      .filter((e) => {
        if (e.fieldKey === 'friendlyName') return true;
        return e.value !== null && e.value !== undefined && e.value !== '';
      }),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(resolvedBackHref)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {resolvedBackLabel}
        </Button>

        {canRefreshData ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              disabled={!device || deviceLoading}
              className="text-muted-foreground"
            >
              <Pencil className="size-3.5" />
              {t('admin.edit')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadDevice()}
              disabled={deviceLoading}
              className="text-muted-foreground"
            >
              <RefreshCw className={cn('size-3.5', deviceLoading && 'animate-spin')} />
              {t('admin.retry')}
            </Button>
          </>
        ) : null}
      </div>

      {error === 'forbidden' ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {t('errors.unauthorized')}
        </div>
      ) : error === 'error' && !device ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {t('common.error')}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start gap-4 px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
            {deviceLoading && !device ? (
              <div className="size-6 animate-pulse rounded-md bg-muted" />
            ) : (
              <span className="text-muted-foreground">
                <DeviceTypeIcon type={device?.type} />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {status && <StatusDot status={status} />}
              <h1 className="truncate text-lg font-semibold text-foreground">
                {deviceLoading && !device
                  ? <span className="inline-block h-6 w-48 animate-pulse rounded-md bg-muted" />
                  : displayName(device) || t('admin.accessControl.connectedDevices.deviceOverviewTitle')}
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{deviceId}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {statusLabel ? (
                <Badge variant="outline" className={cn('text-[10px]', statusBadgeClass)}>
                  {statusLabel}
                </Badge>
              ) : null}
              {device?.protocolAddress ? (
                <Badge variant="secondary" className="text-[10px]">
                  {t('admin.accessControl.connectedDevices.protocolZigbee')}
                </Badge>
              ) : null}
              {device?.type ? (
                <Badge variant="outline" className="text-[10px]">
                  {device.type}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {deviceLoading && !device ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
            <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
      ) : null}

      {device && !deviceLoading ? (
        <div className="space-y-4">
          {fieldGroupsWithEntries.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {fieldGroupsWithEntries.map(({ group, entries }, index) => {
                const groupLabel = tx(GROUP_LABEL_KEYS[group.key] ?? group.key);
                return (
                  <div key={group.key} className={index > 0 ? 'border-t border-border' : undefined}>
                    <div className="px-5 py-3">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {groupLabel}
                      </h2>
                    </div>
                    <dl className="divide-y divide-border">
                      {entries.map(({ fieldKey, label, value, icon }) => {
                        const Icon = FIELD_ICONS[icon];

                        if (fieldKey === 'friendlyName') {
                          const display =
                            device?.name?.trim() || device?.friendlyName?.trim() || null;
                          return (
                            <div
                              key={label}
                              className="grid grid-cols-1 items-start gap-1 px-5 py-2.5 sm:grid-cols-[minmax(9rem,13rem)_1fr]"
                            >
                              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {Icon && <Icon />}
                                {label}
                              </dt>
                              <dd className="space-y-1">
                                <span className="text-sm text-foreground">
                                  {display ?? <span className="text-muted-foreground">—</span>}
                                </span>
                                {device?.friendlyName &&
                                device.friendlyName.trim() !== (device.name?.trim() ?? '') ? (
                                  <p className="text-[11px] text-muted-foreground">
                                    Zigbee: {device.friendlyName}
                                  </p>
                                ) : null}
                              </dd>
                            </div>
                          );
                        }

                        const text =
                          fieldKey === 'deviceTypeId'
                            ? deviceTypeLabel ?? formatScalar(value)
                            : fieldKey === 'deviceId'
                              ? catalogDeviceLabel ?? formatScalar(value)
                              : group.key === 'timestamps' && typeof value === 'string'
                                ? formatDateTime(value, locale)
                                : formatScalar(value);
                        return (
                          <div
                            key={label}
                            className="grid grid-cols-1 items-baseline gap-1 px-5 py-2.5 sm:grid-cols-[minmax(9rem,13rem)_1fr]"
                          >
                            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {Icon && <Icon />}
                              {label}
                            </dt>
                            <dd
                              className={cn(
                                'break-all text-xs text-foreground',
                                fieldKey === 'deviceTypeId' || fieldKey === 'deviceId'
                                  ? 'font-normal'
                                  : 'font-mono',
                              )}
                            >
                              {text === '—' ? <span className="text-muted-foreground">—</span> : text}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                );
              })}
            </div>
          ) : null}

          {device.capabilities && device.capabilities.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('admin.accessControl.connectedDevices.capabilities')}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">{device.capabilities.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-5 py-4">
                {device.capabilities.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {definitionJson ? (
              <CollapsibleJson
                title={t('admin.accessControl.connectedDevices.definitionJsonTitle')}
                json={definitionJson}
                labels={{
                  lines: (count) => tx('admin.accessControl.connectedDevices.deviceDetails.json.lines', { count }),
                  jsonLang: tx('admin.accessControl.connectedDevices.deviceDetails.json.language'),
                  copy: tx('admin.accessControl.connectedDevices.deviceDetails.json.copy'),
                  copied: tx('admin.accessControl.connectedDevices.deviceDetails.json.copied'),
                }}
              />
            ) : null}
            {fullDeviceJson ? (
              <CollapsibleJson
                title={t('admin.accessControl.connectedDevices.fullDeviceJsonTitle')}
                json={fullDeviceJson}
                labels={{
                  lines: (count) => tx('admin.accessControl.connectedDevices.deviceDetails.json.lines', { count }),
                  jsonLang: tx('admin.accessControl.connectedDevices.deviceDetails.json.language'),
                  copy: tx('admin.accessControl.connectedDevices.deviceDetails.json.copy'),
                  copied: tx('admin.accessControl.connectedDevices.deviceDetails.json.copied'),
                }}
              />
            ) : null}
          </div>

          <DeviceHistorySection deviceId={deviceId} canRefreshData={canRefreshData} />
        </div>
      ) : null}

      {device && canRefreshData ? (
        <DeviceEditModal
          isOpen={editOpen}
          onOpenChange={setEditOpen}
          houseId={houseId}
          device={device}
          onSaved={setDevice}
        />
      ) : null}
    </div>
  );
}
