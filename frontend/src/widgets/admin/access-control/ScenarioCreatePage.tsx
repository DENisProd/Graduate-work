'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScenarioEditor } from '@/features/access-control/ui/scenario-editor/ScenarioEditor';

export default function ScenarioCreatePage() {
  const params = useParams();
  const router = useRouter();

  const houseId = useMemo(() => {
    const raw = params?.houseId as string | undefined;
    return raw ? raw : null;
  }, [params]);

  if (!houseId) {
    router.push('/admin/access-control/houses');
    return null;
  }

  return <ScenarioEditor mode="create" houseId={houseId} />;
}

