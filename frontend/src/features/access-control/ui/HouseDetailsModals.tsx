'use client';

import { houseDevicesApi } from '@/lib/api-client';
import { accessServiceRequest } from '@/lib/access-service-http';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared/toast';
import { useAccessControlStore, selectEffectiveOwnerId } from '@/store/access-control-store';
import { useAddDeviceModalStore } from '@/store/add-device-modal-store';
import {
  RoomFormModal,
  MemberFormModal,
  MemberDetailModal,
  InvitationFormModal,
  AccessRightFormModal,
  AddDeviceModal,
} from './modals';

export function HouseDetailsModals() {
  const { t } = useTranslation();

  const houseId = useAccessControlStore((s) => s.houseId);
  const roomModalOpen = useAccessControlStore((s) => s.roomModalOpen);
  const setRoomModalOpen = useAccessControlStore((s) => s.setRoomModalOpen);
  const memberModalOpen = useAccessControlStore((s) => s.memberModalOpen);
  const setMemberModalOpen = useAccessControlStore((s) => s.setMemberModalOpen);
  const memberDetailOpen = useAccessControlStore((s) => s.memberDetailOpen);
  const setMemberDetailOpen = useAccessControlStore((s) => s.setMemberDetailOpen);
  const selectedMember = useAccessControlStore((s) => s.selectedMember);
  const invitationModalOpen = useAccessControlStore((s) => s.invitationModalOpen);
  const setInvitationModalOpen = useAccessControlStore((s) => s.setInvitationModalOpen);
  const rightModalOpen = useAccessControlStore((s) => s.rightModalOpen);
  const setRightModalOpen = useAccessControlStore((s) => s.setRightModalOpen);
  const effectiveOwnerId = useAccessControlStore(selectEffectiveOwnerId);
  const saveRoom = useAccessControlStore((s) => s.saveRoom);
  const addMember = useAccessControlStore((s) => s.addMember);
  const createInvitation = useAccessControlStore((s) => s.createInvitation);
  const createRight = useAccessControlStore((s) => s.createRight);
  const loadRights = useAccessControlStore((s) => s.loadRights);
  const loadAll = useAccessControlStore((s) => s.loadAll);
  const setStatus = useAccessControlStore((s) => s.setStatus);

  const addDeviceModalOpen = useAddDeviceModalStore((s) => s.isOpen);
  const addDeviceModalHouseId = useAddDeviceModalStore((s) => s.houseId);
  const addDeviceModalStep = useAddDeviceModalStore((s) => s.step);
  const addDeviceModalFormData = useAddDeviceModalStore((s) => s.formData);
  const addDeviceModalLoading = useAddDeviceModalStore((s) => s.isLoading);
  const addDeviceModalSetStep = useAddDeviceModalStore((s) => s.setStep);
  const addDeviceModalSetFormData = useAddDeviceModalStore((s) => s.setFormData);
  const addDeviceModalSetLoading = useAddDeviceModalStore((s) => s.setLoading);
  const addDeviceModalClose = useAddDeviceModalStore((s) => s.close);

  const { showToast } = useToast();

  const handleAddDeviceSubmit = async (
    data: Parameters<typeof houseDevicesApi.create>[1]
  ) => {
    if (!addDeviceModalHouseId) return;
    try {
      await houseDevicesApi.create(addDeviceModalHouseId, data);
      setStatus(t('common.success'));
      addDeviceModalClose();
      showToast(t('admin.accessControl.addDevice.success'), 'success');
      await loadAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      showToast(message, 'error');
      throw err;
    }
  };

  if (houseId == null) return null;

  return (
    <>
      <RoomFormModal
        isOpen={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        houseId={houseId}
        onSubmit={saveRoom}
      />
      <MemberFormModal
        isOpen={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        houseId={houseId}
        onSubmit={addMember}
      />
      <MemberDetailModal
        isOpen={memberDetailOpen}
        onOpenChange={setMemberDetailOpen}
        member={selectedMember}
        onCreateRight={createRight}
        onDeleteRight={async (rightId) => {
          try {
            await accessServiceRequest<void>(
              `/api/v1/access-rights/${encodeURIComponent(String(rightId))}`,
              { method: 'DELETE' }
            );
            await loadRights();
            setStatus(t('common.success'));
          } catch (error) {
            console.error(error);
            setStatus(t('common.error'));
          }
        }}
      />
      <InvitationFormModal
        isOpen={invitationModalOpen}
        onOpenChange={setInvitationModalOpen}
        houseId={houseId}
        onSubmit={async (data) => {
          if (!effectiveOwnerId) throw new Error('User not set');
          const invitation = await createInvitation(data, effectiveOwnerId);
          if (invitation?.token && typeof window !== 'undefined') {
            const url = `${window.location.origin}/invite?token=${encodeURIComponent(invitation.token)}`;
            try {
              await navigator.clipboard.writeText(url);
              showToast(t('admin.accessControl.invitationLinkCopied'), 'success');
            } catch {
              showToast(t('admin.accessControl.invitationCreated'), 'success');
            }
          }
          return invitation;
        }}
      />
      <AccessRightFormModal
        isOpen={rightModalOpen}
        onOpenChange={setRightModalOpen}
        houseId={houseId}
        onSubmit={createRight}
      />
      <AddDeviceModal
        isOpen={addDeviceModalOpen}
        onOpenChange={(open) => !open && addDeviceModalClose()}
        houseId={addDeviceModalHouseId}
        step={addDeviceModalStep}
        formData={addDeviceModalFormData}
        isLoading={addDeviceModalLoading}
        onStepChange={addDeviceModalSetStep}
        onFormDataChange={addDeviceModalSetFormData}
        onSetLoading={addDeviceModalSetLoading}
        onSubmit={handleAddDeviceSubmit}
        onClose={addDeviceModalClose}
      />
    </>
  );
}
