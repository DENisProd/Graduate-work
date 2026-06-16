'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioEditor } from '@/features/access-control/ui/scenario-editor/ScenarioEditor';

function paramToString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  return s != null && String(s).length > 0 ? String(s) : null;
}

export default function DashboardScenarioEditPage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => paramToString(params?.houseId), [params]);
  const scenarioId = useMemo(() => paramToString(params?.scenarioId), [params]);

  if (!houseId || !scenarioId) {
    router.push('/dashboard/houses');
    return null;
  }

  return (
    <ScenarioEditor
      mode="edit"
      houseId={houseId}
      scenarioId={scenarioId}
      returnHref={`/dashboard/houses/${encodeURIComponent(houseId)}/scenarios`}
    />
  );
}
