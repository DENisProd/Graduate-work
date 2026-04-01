'use client';

/**
 * @deprecated Use useAccessControlStore from @/store/access-control-store instead.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  houseRoomsApi,
  houseMembersApi,
  houseInvitationsApi,
  accessControlRightsApi,
  mapCreateAccessRightToHouseDomain,
  housesApi,
} from '@/lib/api-client';
import type {
  AccessCheckResponse,
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
import { toArray } from '../lib/utils';

export type HouseDetailsTab = 'rooms' | 'members' | 'invitations' | 'rights' | 'check';

export interface UseHouseDetailsParams {
  houseId: number;
  ownerIdFromUrl: string | undefined;
}

export function useHouseDetails({ houseId, ownerIdFromUrl }: UseHouseDetailsParams) {
  const { t } = useTranslation();
  const [house, setHouse] = useState<HouseResponse | null>(null);
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [members, setMembers] = useState<HouseMemberResponse[]>([]);
  const [invitations, setInvitations] = useState<HouseInvitationResponse[]>([]);
  const [rights, setRights] = useState<HouseAccessRightResponse[]>([]);
  const [status, setStatus] = useState('');

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<HouseMemberResponse | null>(null);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [rightModalOpen, setRightModalOpen] = useState(false);

  const [invitationToken, setInvitationToken] = useState('');
  const [invitationUserId, setInvitationUserId] = useState('');
  const [invitationIdToRevoke, setInvitationIdToRevoke] = useState('');
  const [rightIdToDelete, setRightIdToDelete] = useState('');
  const [rightGrantUserId, setRightGrantUserId] = useState('');

  const effectiveOwnerId = ownerIdFromUrl ?? house?.ownerId;

  const [checkData, setCheckData] = useState({
    userId: '',
    deviceId: '',
    deviceFunctionId: '',
    houseRoomId: '',
    operationType: '',
  });
  const [checkResult, setCheckResult] = useState<AccessCheckResponse | null>(null);
  const [activeTab, setActiveTab] = useState<HouseDetailsTab>('rooms');

  const loadRooms = async () => {
    if (!houseId) return;
    try {
      const data = await houseRoomsApi.getByHouseId(houseId);
      setRooms(toArray<HouseRoomResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const loadMembers = async () => {
    if (!houseId) return;
    try {
      const data = await houseMembersApi.getByHouseId(houseId, { page: 0, size: 50 });
      setMembers(toArray<HouseMemberResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const loadInvitations = async () => {
    if (!houseId) return;
    try {
      const data = await houseInvitationsApi.getByHouseId(houseId, { page: 0, size: 50 });
      setInvitations(toArray<HouseInvitationResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const loadRights = async () => {
    if (!houseId) return;
    try {
      const data = await accessControlRightsApi.getByHouse(String(houseId), { page: 0, size: 50 });
      setRights(toArray<HouseAccessRightResponse>(data));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  useEffect(() => {
    if (!houseId) return;
    const timeoutId = setTimeout(() => {
      housesApi.getById(houseId).then(setHouse).catch(() => setStatus(t('common.error')));
      loadRooms();
      loadMembers();
      loadInvitations();
      loadRights();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [houseId]);

  const saveRoom = async (data: HouseRoomRequest) => {
    await houseRoomsApi.create({ ...data, houseId });
    setStatus(t('common.success'));
    await loadRooms();
  };

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

  const createInvitation = async (data: HouseInvitationRequest, inviterId: string) => {
    await houseInvitationsApi.create(houseId, data, inviterId);
    setStatus(t('common.success'));
    await loadInvitations();
  };

  const acceptInvitation = async () => {
    const userId = effectiveOwnerId ?? invitationUserId;
    if (!userId) return;
    try {
      await houseInvitationsApi.accept(invitationToken, userId);
      await loadInvitations();
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

  const revokeInvitation = async (id: number | string) => {
    const userId = effectiveOwnerId ?? invitationUserId;
    if (!userId) return;
    try {
      await houseInvitationsApi.revoke(id, userId);
      await loadInvitations();
      setStatus(t('common.success'));
    } catch (error) {
      console.error(error);
      setStatus(t('common.error'));
    }
  };

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

  const checkAccess = async () => {
    // checkAccess endpoint removed in new RBAC API
    setStatus(t('common.error'));
  };

  const openMemberDetail = (member: HouseMemberResponse) => {
    setSelectedMember(member);
    setMemberDetailOpen(true);
  };

  return {
    house,
    rooms,
    members,
    invitations,
    rights,
    status,
    effectiveOwnerId,
    activeTab,
    setActiveTab,
    roomModalOpen,
    setRoomModalOpen,
    memberModalOpen,
    setMemberModalOpen,
    memberDetailOpen,
    setMemberDetailOpen,
    selectedMember,
    setSelectedMember,
    invitationModalOpen,
    setInvitationModalOpen,
    rightModalOpen,
    setRightModalOpen,
    invitationToken,
    setInvitationToken,
    invitationUserId,
    setInvitationUserId,
    invitationIdToRevoke,
    setInvitationIdToRevoke,
    rightIdToDelete,
    setRightIdToDelete,
    rightGrantUserId,
    setRightGrantUserId,
    checkData,
    setCheckData,
    checkResult,
    loadRooms,
    loadMembers,
    loadInvitations,
    loadRights,
    saveRoom,
    addMember,
    removeMember,
    createInvitation,
    acceptInvitation,
    revokeInvitation,
    createRight,
    deleteRight,
    checkAccess,
    openMemberDetail,
    setStatus,
  };
}

export type UseHouseDetailsReturn = ReturnType<typeof useHouseDetails>;
