'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioEditor } from '@/features/access-control/ui/scenario-editor/ScenarioEditor';

export default function ScenarioEditPage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => {
    const raw = params?.houseId as string | undefined;
    return raw ? raw : null;
  }, [params]);

  const scenarioId = params?.scenarioId as string | undefined;

  if (!houseId || !scenarioId) {
    router.push('/admin/access-control/houses');
    return null;
  }

  return <ScenarioEditor mode="edit" houseId={houseId} scenarioId={scenarioId} />;
}

