'use client';

import { useParams, useRouter } from 'next/navigation';
import { RoomsTab } from '@/features/access-control/ui/house-details';

export default function HouseRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const houseIdParam = params?.houseId as string | undefined;

  const onRoomPlanner = () => {
    if (houseIdParam) {
      router.push(`/dashboard/houses/${encodeURIComponent(houseIdParam)}/room-planner`);
    }
  };

  return <RoomsTab houseIdParam={houseIdParam} onRoomPlanner={onRoomPlanner} isAdmin={false} />;
}

