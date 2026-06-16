'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioEditor } from '@/features/access-control/ui/scenario-editor/ScenarioEditor';

function paramToString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  return s != null && String(s).length > 0 ? String(s) : null;
}

export default function DashboardScenarioCreatePage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => paramToString(params?.houseId), [params]);

  if (!houseId) {
    router.push('/dashboard/houses');
    return null;
  }

  return (
    <ScenarioEditor
      mode="create"
      houseId={houseId}
      returnHref={`/dashboard/houses/${encodeURIComponent(houseId)}/scenarios`}
    />
  );
}
