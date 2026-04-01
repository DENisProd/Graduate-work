'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DeviceRequest, DeviceResponse, DeviceCategoryResponse, DeviceStatus } from '@/types/api';
import { useTranslation } from '@/hooks';
import { AdminSelect } from '@/components/shared/AdminSelect';

interface DeviceFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: DeviceRequest;
  setFormData: React.Dispatch<React.SetStateAction<DeviceRequest>>;
  categories: DeviceCategoryResponse[];
  editingDevice: DeviceResponse | null;
  onSubmit: () => void;
}

export function DeviceFormModal({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  categories,
  editingDevice,
  onSubmit,
}: DeviceFormModalProps) {
  const { t } = useTranslation();

  const categoryOptions = categories.map((c) => {
    const tr = c.translations as Record<string, { name?: string }> | undefined;
    const name =
      c.name || tr?.ru?.name || tr?.en?.name || c.code;
    return { id: c.id.toString(), text: name };
  });

  const statusOptions = [
    { id: 'ONLINE', text: t('admin.status.online') },
    { id: 'OFFLINE', text: t('admin.status.offline') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editingDevice ? t('admin.editDevice') : t('admin.createDevice')}
          </DialogTitle>
        </DialogHeader>
        <div className="admin-modal-body overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">{t('admin.basicInfo')}</h3>
              <div className="admin-form-grid">
                <div className="admin-form-full-width space-y-2">
                  <label className="text-sm font-medium">{t('admin.code')}</label>
                  <Input
                    placeholder={t('admin.placeholders.codeDevice')}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('admin.helpers.codeDevice')}</p>
                </div>
                <div className="admin-form-full-width space-y-2">
                  <AdminSelect
                    label={t('admin.deviceCategory')}
                    placeholder={t('admin.placeholders.selectDeviceCategory')}
                    value={
                      formData.deviceCategoryId != null
                        ? String(formData.deviceCategoryId)
                        : null
                    }
                    onChange={(value) => {
                      if (value != null) {
                        setFormData({
                          ...formData,
                          deviceCategoryId: parseInt(value),
                        });
                      }
                    }}
                    options={categoryOptions}
                    isRequired
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('admin.helpers.deviceCategorySelect')}
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section-title mb-3">{t('admin.translations')} *</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-20">
                        {t('admin.locale')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        {t('admin.name')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        {t('admin.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium align-top pt-4">RU</td>
                      <td className="px-4 py-3 space-y-1">
                        <Input
                          placeholder={t('admin.placeholders.nameDeviceRu')}
                          value={formData.translations.ru.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              translations: {
                                ...formData.translations,
                                ru: { ...formData.translations.ru, name: e.target.value },
                              },
                            })
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">{t('admin.helpers.name')}</p>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <Textarea
                          placeholder={t('admin.placeholders.descriptionDeviceRu')}
                          value={formData.translations.ru.description || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              translations: {
                                ...formData.translations,
                                ru: {
                                  ...formData.translations.ru,
                                  description: e.target.value,
                                },
                              },
                            })
                          }
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.helpers.description')}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium align-top pt-4">EN</td>
                      <td className="px-4 py-3 space-y-1">
                        <Input
                          placeholder={t('admin.placeholders.nameDeviceEn')}
                          value={formData.translations.en.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              translations: {
                                ...formData.translations,
                                en: { ...formData.translations.en, name: e.target.value },
                              },
                            })
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">{t('admin.helpers.name')}</p>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <Textarea
                          placeholder={t('admin.placeholders.descriptionDeviceEn')}
                          value={formData.translations.en.description || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              translations: {
                                ...formData.translations,
                                en: {
                                  ...formData.translations.en,
                                  description: e.target.value,
                                },
                              },
                            })
                          }
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.helpers.description')}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
