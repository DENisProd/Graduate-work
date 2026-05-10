'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import {
  houseRoomsApi,
  houseMembersApi,
  houseInvitationsApi,
  accessControlRightsApi,
  mapCreateAccessRightToHouseDomain,
  housesApi,
} from '@/lib/api-client';
import type {
  CreateAccessRightDto,
  HouseAccessRightResponse,
  HouseInvitationRequest,
  HouseInvitationResponse,
  HouseMemberResponse,
  HouseRoomRequest,
  HouseRoomResponse,
  HouseResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { toArray, getAccessTypeLabel } from '../lib/utils';
import {
  RoomFormModal,
  MemberFormModal,
  MemberDetailModal,
  AccessRightFormModal,
  InvitationFormModal,
} from './modals';
import { LabeledInput } from './house-details/tabs/LabeledInput';

export type HousePanelSubpage = 'house_members' | 'house_rooms' | 'access_house_access_rights';

interface AccessControlHousePanelProps {
  houseId: number;
  ownerId?: string;
  onClose: () => void;
}

export function AccessControlHousePanel({ houseId, ownerId, onClose }: AccessControlHousePanelProps) {
  const { t, locale } = useTranslation();
  const [house, setHouse] = useState<HouseResponse | null>(null);
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [members, setMembers] = useState<HouseMemberResponse[]>([]);
  const [rights, setRights] = useState<HouseAccessRightResponse[]>([]);
  const [status, setStatus] = useState('');
  const [activeSubpage, setActiveSubpage] = useState<HousePanelSubpage>('house_rooms');

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<HouseMemberResponse | null>(null);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [invitations, setInvitations] = useState<HouseInvitationResponse[]>([]);
  const [rightModalOpen, setRightModalOpen] = useState(false);
  const [rightIdToDelete, setRightIdToDelete] = useState('');
  const [rightGrantUserId, setRightGrantUserId] = useState('');

  const loadRooms = useCallback(async () => {
    try {
      const data = await houseRoomsApi.getByHouseId(houseId);
      setRooms(toArray<HouseRoomResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  }, [houseId, t]);

  const saveRoom = async (data: HouseRoomRequest) => {
    await houseRoomsApi.create({ ...data, houseId });
    setStatus(t('common.success'));
    await loadRooms();
  };

  const loadMembers = useCallback(async () => {
    try {
      const data = await houseMembersApi.getByHouseId(houseId, { page: 0, size: 50 });
      setMembers(toArray<HouseMemberResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  }, [houseId, t]);

  const addMember = async (userId: string) => {
    await houseMembersApi.addMember(houseId, userId);
    setStatus(t('common.success'));
    await loadMembers();
  };

  const removeMember = async (userId: string) => {
    try {
      await houseMembersApi.removeMember(houseId, userId);
      await loadMembers();
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const loadInvitations = useCallback(async () => {
    try {
      const data = await houseInvitationsApi.getByHouseId(houseId, { page: 0, size: 100 });
      setInvitations(toArray<HouseInvitationResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  }, [houseId, t]);

  const createInvitation = async (data: HouseInvitationRequest) => {
    if (!ownerId && !house?.ownerId) throw new Error('User not set');
    const userId = ownerId ?? house?.ownerId!;
    const invitation = await houseInvitationsApi.create(houseId, data, userId);
    setStatus(t('common.success'));
    await loadInvitations();
    return invitation;
  };

  const revokeInvitation = async (invitationId: number | string) => {
    const userId = ownerId ?? house?.ownerId;
    if (!userId) return;
    try {
      await houseInvitationsApi.revoke(invitationId, userId);
      await loadInvitations();
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const loadRights = useCallback(async () => {
    try {
      const data = await accessControlRightsApi.getByHouse(String(houseId), { page: 0, size: 50 });
      setRights(toArray<HouseAccessRightResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  }, [houseId, t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      housesApi.getById(houseId).then(setHouse).catch(() => setStatus(t('common.error')));
      loadRooms();
      loadMembers();
      loadInvitations();
      loadRights();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [houseId, loadRooms, loadMembers, loadInvitations, loadRights, t]);

  const createRight = async (data: CreateAccessRightDto) => {
    await accessControlRightsApi.create(mapCreateAccessRightToHouseDomain(data));
    setStatus(t('common.success'));
    await loadRights();
  };

  const deleteRight = async () => {
    if (!rightIdToDelete) return;
    try {
      await accessControlRightsApi.delete(rightIdToDelete);
      await loadRights();
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const subpages: { id: HousePanelSubpage; label: string }[] = [
    { id: 'house_members', label: t('admin.accessControl.members') },
    { id: 'house_rooms', label: t('admin.accessControl.houseRooms') },
    { id: 'access_house_access_rights', label: t('admin.accessControl.rights') },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{house?.name ?? t('admin.accessControl.manageHouse')}</h3>
          <p className="text-muted-foreground text-sm">{house?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          {status && <Badge variant="secondary">{status}</Badge>}
          <AppButton size="sm" variant="secondary" onClick={onClose}>
            {t('admin.accessControl.closePanel')}
          </AppButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {subpages.map(({ id, label }) => (
          <AppButton
            key={id}
            size="sm"
            variant={activeSubpage === id ? 'default' : 'secondary'}
            onClick={() => setActiveSubpage(id)}
          >
            {label}
          </AppButton>
        ))}
      </div>

      {activeSubpage === 'house_rooms' && (
        <div className="space-y-4">
          <AppButton onClick={() => setRoomModalOpen(true)}>
            {t('admin.create')} — {t('admin.accessControl.houseRooms')}
          </AppButton>
          {rooms.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-md"
                >
                  <h4 className="font-medium text-foreground">{room.name ?? room.externalId ?? '—'}</h4>
                  {room.houseName && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{room.houseName}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">ID: {room.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubpage === 'house_members' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <AppButton onClick={() => setMemberModalOpen(true)}>
              {t('admin.create')} — {t('admin.accessControl.members')}
            </AppButton>
            <AppButton onClick={() => setInvitationModalOpen(true)}>
              {t('admin.accessControl.inviteMember')}
            </AppButton>
          </div>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('admin.accessControl.invitations')}
            </h4>
            {invitations.length > 0 ? (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      {inv.note && (
                        <p className="text-sm font-medium text-foreground">
                          {inv.note}
                        </p>
                      )}
                      {inv.expiresAt && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t('admin.accessControl.expiresAt')}: {new Date(inv.expiresAt).toLocaleString()}
                        </p>
                      )}
                      {inv.token && (
                        <p className="mt-1 text-xs text-muted-foreground font-mono">{inv.token.slice(0, 12)}…</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {(() => {
                          const ru = locale === 'ru';
                          switch (inv.status) {
                            case 'PENDING': return ru ? 'Ожидает' : 'Pending';
                            case 'ACCEPTED': return ru ? 'Принято' : 'Accepted';
                            case 'DECLINED': return ru ? 'Отклонено' : 'Declined';
                            case 'REVOKED': return ru ? 'Отозвано' : 'Revoked';
                            case 'EXPIRED': return ru ? 'Истекло' : 'Expired';
                            default: return inv.status;
                          }
                        })()}
                      </span>
                      {(inv.status === 'PENDING') && (
                        <AppButton
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeInvitation(inv.id)}
                        >
                          {t('admin.accessControl.revokeInvitation')}
                        </AppButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.accessControl.noInvitations')}</p>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
              {t('admin.accessControl.members')}
            </h4>
            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-md transition-all hover:border-accent/40 hover:shadow-lg"
                    onClick={() => {
                      setSelectedMember(member);
                      setMemberDetailOpen(true);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {t('admin.accessControl.userId')}: {member.userId}
                      </p>
                      {member.houseName && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{member.houseName}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">ID: {member.id}</p>
                    </div>
                    <AppButton
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMember(member.userId);
                      }}
                    >
                      {t('admin.delete')}
                    </AppButton>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('admin.accessControl.noMembers')}</p>
            )}
          </section>
        </div>
      )}

      {activeSubpage === 'access_house_access_rights' && (
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
            <LabeledInput
              label={t('admin.accessControl.grantedBy')}
              placeholder={t('admin.accessControl.placeholders.grantedBy')}
              value={rightGrantUserId}
              onChange={(e) => setRightGrantUserId(e.target.value)}
            />
            <AppButton onClick={deleteRight} variant="destructive">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('admin.accessControl.userId')}: {right.userId ?? '—'} · ID: {right.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
      />
      <InvitationFormModal
        isOpen={invitationModalOpen}
        onOpenChange={setInvitationModalOpen}
        houseId={houseId}
        onSubmit={createInvitation}
      />
      <AccessRightFormModal
        isOpen={rightModalOpen}
        onOpenChange={setRightModalOpen}
        houseId={houseId}
        onSubmit={createRight}
      />
    </div>
  );
}
