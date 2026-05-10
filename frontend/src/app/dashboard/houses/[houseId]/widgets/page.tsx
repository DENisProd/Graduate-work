'use client';

import { useParams } from 'next/navigation';
import { HouseWidgetsSection } from '@/features/widget-dashboard/ui/HouseWidgetsSection';

export default function WidgetsPage() {
  const params = useParams();
  const houseId = params.houseId as string;
  return <HouseWidgetsSection houseId={houseId} titleVariant="none" className="mb-0" />;
}
