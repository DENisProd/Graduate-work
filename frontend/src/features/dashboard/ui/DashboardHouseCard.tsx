'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';
import type { HouseResponse } from '@/types/api';
import { useTranslation } from '@/hooks';

interface DashboardHouseCardProps {
  house: HouseResponse;
  basePath?: string;
}

export function DashboardHouseCard({ house, basePath = '/dashboard/houses' }: DashboardHouseCardProps) {
  const { t } = useTranslation();
  const href = `${basePath}/${house.id}`;
  return (
    <Link href={href}>
      <Card className="flex h-full cursor-pointer flex-col border border-border bg-card p-6 shadow transition-shadow hover:shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{house.name}</h3>
              {house.address && (
                <p className="truncate text-xs text-muted-foreground">{house.address}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('dashboard.devices')}</span>
            <span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('dashboard.activeScenarios')}</span>
            <span className="font-medium">—</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
