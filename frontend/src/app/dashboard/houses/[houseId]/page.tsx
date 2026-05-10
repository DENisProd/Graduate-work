'use client';

import { useParams } from 'next/navigation';
import { HouseWidgetsSection } from '@/features/widget-dashboard/ui/HouseWidgetsSection';

export default function HouseOverviewRoutePage() {
  const params = useParams();
  const houseId = params.houseId as string;

  return (
    <div className="space-y-8">
      <HouseWidgetsSection houseId={houseId} />
    </div>
  );
}

