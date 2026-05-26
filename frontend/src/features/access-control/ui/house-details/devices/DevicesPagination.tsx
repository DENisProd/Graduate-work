'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';

interface DevicesPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DevicesPagination({ page, totalPages, onPageChange }: DevicesPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <AppButton
        size="sm"
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {t('admin.previous')}
      </AppButton>
      <span className="text-xs text-muted-foreground">
        {t('admin.page')} {page} / {totalPages}
      </span>
      <AppButton
        size="sm"
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        {t('admin.next')}
      </AppButton>
    </div>
  );
}
