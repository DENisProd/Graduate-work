'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { getAccessTypeLabel } from '../../../lib/utils';
import { useAccessControlStore, selectEffectiveOwnerId } from '@/store/access-control-store';
import { LabeledInput } from '../tabs/LabeledInput';

export function RightsBlock() {
  const { t } = useTranslation();

  const rights = useAccessControlStore((s) => s.rights);
  const rightIdToDelete = useAccessControlStore((s) => s.rightIdToDelete);
  const setRightIdToDelete = useAccessControlStore((s) => s.setRightIdToDelete);
  const rightGrantUserId = useAccessControlStore((s) => s.rightGrantUserId);
  const setRightGrantUserId = useAccessControlStore((s) => s.setRightGrantUserId);
  const effectiveOwnerId = useAccessControlStore(selectEffectiveOwnerId);
  const setRightModalOpen = useAccessControlStore((s) => s.setRightModalOpen);
  const deleteRight = useAccessControlStore((s) => s.deleteRight);

  return (
    <div className="space-y-4">
      <AppButton onClick={() => setRightModalOpen(true)}>
        {t('admin.create')} — {t('admin.accessControl.rights')}
      </AppButton>

      <div className="grid gap-3 md:grid-cols-3">
        <LabeledInput
          label="Right ID"
          placeholder={t('admin.accessControl.placeholders.rightId')}
          value={rightIdToDelete}
          onChange={(e) => setRightIdToDelete(e.target.value)}
        />
        {effectiveOwnerId == null && (
          <LabeledInput
            label={t('admin.accessControl.grantedBy')}
            placeholder={t('admin.accessControl.placeholders.grantedBy')}
            value={rightGrantUserId}
            onChange={(e) => setRightGrantUserId(e.target.value)}
          />
        )}
        <AppButton
          onClick={deleteRight}
          variant="destructive"
          disabled={effectiveOwnerId == null && !rightGrantUserId.trim()}
        >
          {t('admin.delete')}
        </AppButton>
      </div>

      {rights.length > 0 && (
        <div className="space-y-2">
          {rights.map((right) => (
            <div
              key={right.id}
              className="rounded-xl border border-border bg-card p-4 shadow-md"
            >
              <p className="font-medium text-foreground">
                {getAccessTypeLabel(t, right.accessRightType)}
              </p>
              {(right.houseRoomName || right.houseName) && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {right.houseRoomName || right.houseName}
                </p>
              )}
              {(right.houseMemberId || right.houseRoleId) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {right.houseMemberId && `member: ${right.houseMemberId}`}
                  {right.houseMemberId && right.houseRoleId ? ' · ' : ''}
                  {right.houseRoleId && `role: ${right.houseRoleId}`}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">ID: {right.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

