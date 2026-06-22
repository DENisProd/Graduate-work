'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { housesApi } from '@/lib/api/access-service';
import {
  canControlDevicePower,
  canControlDeviceTargetTemp,
  canWriteFunction,
  type DeviceLabelSource,
  type FunctionAccessMap,
} from '@/lib/device-function-access';
import { useCurrentUserId } from './use-current-user-id';
import { useAccessControlStore } from '@/store/access-control-store';
import { hasPlatformAdminRole } from '@/lib/auth/jwt-roles';

type SessionWithToken = { accessToken?: string | null };

export interface UseHouseFunctionAccessOptions {
  ownerId?: string | null;
  isPlatformAdmin?: boolean;
}

export function useHouseFunctionAccess(options?: UseHouseFunctionAccessOptions): {
  functionAccess: FunctionAccessMap | null;
  loading: boolean;
  canWriteFn: (functionKey: string) => boolean;
  canControlPower: (device: DeviceLabelSource) => boolean;
  canControlTargetTemp: (device: DeviceLabelSource) => boolean;
} {
  const params = useParams();
  const houseId = (params?.houseId as string | undefined) ?? null;
  const currentUserId = useCurrentUserId();
  const { data: session } = useSession();
  const house = useAccessControlStore((s) => s.house);
  const [functionAccess, setFunctionAccess] = useState<FunctionAccessMap | null>(null);
  const [loading, setLoading] = useState(false);

  const isPlatformAdmin =
    options?.isPlatformAdmin ??
    hasPlatformAdminRole((session as SessionWithToken | null)?.accessToken);

  const isOwner = Boolean(
    currentUserId &&
      ((house?.ownerId && house.ownerId === currentUserId) ||
        (options?.ownerId && options.ownerId === currentUserId)),
  );
  const fullAccess = isOwner || isPlatformAdmin;

  useEffect(() => {
    if (!houseId || !currentUserId) {
      setFunctionAccess(null);
      setLoading(false);
      return;
    }
    if (fullAccess) {
      setFunctionAccess(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setFunctionAccess(null);
    setLoading(true);
    void housesApi
      .getFunctionAccess(houseId)
      .then((data) => {
        if (!cancelled) setFunctionAccess(data);
      })
      .catch(() => {
        if (!cancelled) setFunctionAccess({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [houseId, currentUserId, fullAccess]);

  const canWriteFn = useMemo(
    () => (functionKey: string) => {
      if (fullAccess) return true;
      return canWriteFunction(functionAccess, functionKey);
    },
    [fullAccess, functionAccess],
  );

  const canControlPower = useMemo(
    () => (device: DeviceLabelSource) => {
      if (fullAccess) return true;
      return canControlDevicePower(functionAccess, device);
    },
    [fullAccess, functionAccess],
  );

  const canControlTargetTemp = useMemo(
    () => (device: DeviceLabelSource) => {
      if (fullAccess) return true;
      return canControlDeviceTargetTemp(functionAccess, device);
    },
    [fullAccess, functionAccess],
  );

  return { functionAccess, loading, canWriteFn, canControlPower, canControlTargetTemp };
}
