'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { LabeledInput } from './LabeledInput';

interface CheckTabProps {
  onCheck: () => void;
}

export function CheckTab({ onCheck }: CheckTabProps) {
  const { t } = useTranslation();
  const checkData = useAccessControlStore((s) => s.checkData);
  const setCheckData = useAccessControlStore((s) => s.setCheckData);
  const checkResult = useAccessControlStore((s) => s.checkResult);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <LabeledInput
          label={t('admin.accessControl.userId')}
          placeholder={t('admin.accessControl.placeholders.userId')}
          value={checkData.userId}
          onChange={(e) => setCheckData((p) => ({ ...p, userId: e.target.value }))}
        />
        <LabeledInput
          label={t('admin.accessControl.deviceId')}
          placeholder={t('admin.accessControl.placeholders.deviceId')}
          value={checkData.deviceId}
          onChange={(e) => setCheckData((p) => ({ ...p, deviceId: e.target.value }))}
        />
        <LabeledInput
          label={t('admin.accessControl.deviceFunctionId')}
          placeholder={t('admin.accessControl.placeholders.deviceFunctionId')}
          value={checkData.deviceFunctionId}
          onChange={(e) =>
            setCheckData((p) => ({ ...p, deviceFunctionId: e.target.value }))
          }
        />
        <LabeledInput
          label={t('admin.accessControl.houseRoomId')}
          placeholder={t('admin.accessControl.placeholders.houseRoomId')}
          value={checkData.houseRoomId}
          onChange={(e) => setCheckData((p) => ({ ...p, houseRoomId: e.target.value }))}
        />
        <LabeledInput
          label={t('admin.accessControl.operationType')}
          placeholder={t('admin.accessControl.placeholders.operationType')}
          value={checkData.operationType}
          onChange={(e) => setCheckData((p) => ({ ...p, operationType: e.target.value }))}
        />
        <AppButton onClick={onCheck}>
          {t('admin.accessControl.send')}
        </AppButton>
      </div>
      {checkResult && (
        <div className="rounded-md border border-border bg-surface-2 p-3 text-sm">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(checkResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
