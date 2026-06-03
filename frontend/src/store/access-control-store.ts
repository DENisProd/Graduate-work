'use client';

import { create } from 'zustand';
import {
  houseRoomsApi,
  houseMembersApi,
  houseInvitationsApi,
  accessControlRightsApi,
  mapCreateAccessRightToHouseDomain,
  housesApi,
} from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
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
import { toArray } from '@/features/access-control/lib/utils';

export const HOUSE_DETAILS_TABS = ['rooms', 'members', 'roles', 'devices', 'scenarios'] as const;

export type HouseDetailsTab = (typeof HOUSE_DETAILS_TABS)[number];

const LEGACY_HOUSE_DETAILS_TAB_MAP: Record<string, HouseDetailsTab> = {
  invitations: 'members',
  rights: 'roles',
  check: 'roles',
  analysis: 'devices',
};

function isHouseDetailsTab(tab: string): tab is HouseDetailsTab {
  return (HOUSE_DETAILS_TABS as readonly string[]).includes(tab);
}

export function normalizeHouseDetailsTab(tab: string): HouseDetailsTab {
  if (isHouseDetailsTab(tab)) return tab;
  return LEGACY_HOUSE_DETAILS_TAB_MAP[tab] ?? 'rooms';
}

const defaultCheckData = {
  userId: '',
  deviceId: '',
  deviceFunctionId: '',
  houseRoomId: '',
  operationType: '',
};

interface AccessControlState {
  houseId: string | null;
  ownerIdFromUrl: string | undefined;
  house: HouseResponse | null;
  rooms: HouseRoomResponse[];
  members: HouseMemberResponse[];
  invitations: HouseInvitationResponse[];
  rights: HouseAccessRightResponse[];
  status: string;
  activeTab: HouseDetailsTab;

  roomModalOpen: boolean;
  memberModalOpen: boolean;
  memberDetailOpen: boolean;
  selectedMember: HouseMemberResponse | null;
  invitationModalOpen: boolean;
  rightModalOpen: boolean;

  invitationToken: string;
  invitationUserId: string;
  invitationIdToRevoke: string;
  rightIdToDelete: string;
  rightGrantUserId: string;

  checkData: typeof defaultCheckData;
  checkResult: AccessCheckResponse | null;
}

type GetState = () => AccessControlState;

interface AccessControlActions {
  setHouseId: (id: string | null) => void;
  setOwnerIdFromUrl: (id: string | undefined) => void;
  setStatus: (status: string) => void;
  setActiveTab: (tab: string) => void;

  setRoomModalOpen: (open: boolean) => void;
  setMemberModalOpen: (open: boolean) => void;
  setMemberDetailOpen: (open: boolean) => void;
  setSelectedMember: (member: HouseMemberResponse | null) => void;
  setInvitationModalOpen: (open: boolean) => void;
  setRightModalOpen: (open: boolean) => void;

  setInvitationToken: (v: string) => void;
  setInvitationUserId: (v: string) => void;
  setInvitationIdToRevoke: (v: string) => void;
  setRightIdToDelete: (v: string) => void;
  setRightGrantUserId: (v: string) => void;

  setCheckData: (data: Partial<typeof defaultCheckData> | ((prev: typeof defaultCheckData) => Partial<typeof defaultCheckData>)) => void;

  loadAll: () => Promise<void>;
  loadRooms: () => Promise<void>;
  loadMembers: () => Promise<void>;
  loadInvitations: () => Promise<void>;
  loadRights: () => Promise<void>;

  saveRoom: (data: HouseRoomRequest) => Promise<void>;
  addMember: (userId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  createInvitation: (data: HouseInvitationRequest, inviterId: string) => Promise<HouseInvitationResponse>;
  acceptInvitation: () => Promise<void>;
  revokeInvitation: (id: number | string) => Promise<void>;
  createRight: (data: CreateAccessRightDto) => Promise<void>;
  deleteRight: () => Promise<void>;
  checkAccess: () => Promise<void>;

  openMemberDetail: (member: HouseMemberResponse) => void;
  reset: () => void;
}

const initialState: AccessControlState = {
  houseId: null,
  ownerIdFromUrl: undefined,
  house: null,
  rooms: [],
  members: [],
  invitations: [],
  rights: [],
  status: '',
  activeTab: 'rooms',
  roomModalOpen: false,
  memberModalOpen: false,
  memberDetailOpen: false,
  selectedMember: null,
  invitationModalOpen: false,
  rightModalOpen: false,
  invitationToken: '',
  invitationUserId: '',
  invitationIdToRevoke: '',
  rightIdToDelete: '',
  rightGrantUserId: '',
  checkData: defaultCheckData,
  checkResult: null,
};

function getEffectiveOwnerId(getState: GetState): string | undefined {
  const s = getState();
  return s.ownerIdFromUrl ?? s.house?.ownerId;
}

export const useAccessControlStore = create<AccessControlState & AccessControlActions>((set, get) => ({
  ...initialState,

  setHouseId: (id) =>
    set((s) => (s.houseId === id ? s : { ...initialState, houseId: id, ownerIdFromUrl: s.ownerIdFromUrl })),

  setOwnerIdFromUrl: (id) => set({ ownerIdFromUrl: id }),

  setStatus: (status) => set({ status }),
  setActiveTab: (tab) => set({ activeTab: normalizeHouseDetailsTab(tab) }),

  setRoomModalOpen: (open) => set({ roomModalOpen: open }),
  setMemberModalOpen: (open) => set({ memberModalOpen: open }),
  setMemberDetailOpen: (open) => set({ memberDetailOpen: open }),
  setSelectedMember: (member) => set({ selectedMember: member }),
  setInvitationModalOpen: (open) => set({ invitationModalOpen: open }),
  setRightModalOpen: (open) => set({ rightModalOpen: open }),

  setInvitationToken: (v) => set({ invitationToken: v }),
  setInvitationUserId: (v) => set({ invitationUserId: v }),
  setInvitationIdToRevoke: (v) => set({ invitationIdToRevoke: v }),
  setRightIdToDelete: (v) => set({ rightIdToDelete: v }),
  setRightGrantUserId: (v) => set({ rightGrantUserId: v }),

  setCheckData: (dataOrFn) =>
    set((s) => ({
      checkData:
        typeof dataOrFn === 'function'
          ? { ...s.checkData, ...dataOrFn(s.checkData) }
          : { ...s.checkData, ...dataOrFn },
    })),

  loadAll: async () => {
    const { houseId } = get();
    if (!houseId) return;
    try {
      const house = await housesApi.getById(houseId);
      set({ house });
      const effectiveHouseId = typeof house.id === 'number' ? house.id : houseId;
      const invitationsPromise = houseInvitationsApi
        .getByHouseId(effectiveHouseId, { page: 0, size: 50 })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) return { content: [] };
          throw e;
        });
      const rightsPromise = accessControlRightsApi
        .getByHouse(String(effectiveHouseId), { page: 0, size: 50 })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) return { content: [] };
          throw e;
        });
      const [roomsData, membersData, invitationsData, rightsData] = await Promise.all([
        houseRoomsApi.getByHouseId(effectiveHouseId),
        houseMembersApi.getByHouseId(effectiveHouseId, { page: 0, size: 50 }),
        invitationsPromise,
        rightsPromise,
      ]);
      set({
        rooms: toArray<HouseRoomResponse>(roomsData),
        members: toArray<HouseMemberResponse>(membersData),
        invitations: toArray<HouseInvitationResponse>(invitationsData),
        rights: toArray<HouseAccessRightResponse>(rightsData),
      });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  loadRooms: async () => {
    const { houseId, house } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    try {
      const data = await houseRoomsApi.getByHouseId(effectiveId);
      set({ rooms: toArray<HouseRoomResponse>(data) });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  loadMembers: async () => {
    const { houseId, house } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    try {
      const data = await houseMembersApi.getByHouseId(effectiveId, { page: 0, size: 50 });
      set({ members: toArray<HouseMemberResponse>(data) });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  loadInvitations: async () => {
    const { houseId, house } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    try {
      const data = await houseInvitationsApi.getByHouseId(effectiveId, { page: 0, size: 50 });
      set({ invitations: toArray<HouseInvitationResponse>(data) });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  loadRights: async () => {
    const { houseId, house } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    try {
      const data = await accessControlRightsApi.getByHouse(String(effectiveId), { page: 0, size: 50 });
      set({ rights: toArray<HouseAccessRightResponse>(data) });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  saveRoom: async (data) => {
    const { houseId, house, loadRooms } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    await houseRoomsApi.create({ ...data, houseId: effectiveId });
    set({ status: 'success' });
    await loadRooms();
  },

  addMember: async (userId) => {
    const { houseId, house, loadMembers } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    await houseMembersApi.addMember(effectiveId, userId);
    set({ status: 'success' });
    await loadMembers();
  },

  removeMember: async (userId: string) => {
    const { houseId, house, loadMembers } = get();
    if (!houseId) return;
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    try {
      await houseMembersApi.removeMember(effectiveId, userId);
      await loadMembers();
      set({ status: 'success' });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  createInvitation: async (data, inviterId) => {
    const { houseId, house, loadInvitations } = get();
    if (!houseId) throw new Error('No houseId');
    const effectiveId = house && typeof house.id === 'number' ? house.id : houseId;
    const result = await houseInvitationsApi.create(effectiveId, data, inviterId);
    set({ status: 'success' });
    await loadInvitations();
    return result;
  },

  acceptInvitation: async () => {
    const { invitationToken, invitationUserId, loadInvitations } = get();
    const effectiveOwnerId = getEffectiveOwnerId(get);
    const userId = effectiveOwnerId ?? invitationUserId;
    if (!userId) return;
    try {
      await houseInvitationsApi.accept(invitationToken, userId);
      await loadInvitations();
      set({ status: 'success' });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  revokeInvitation: async (id) => {
    const { loadInvitations } = get();
    const userId = getEffectiveOwnerId(get);
    if (!userId) return;
    try {
      await houseInvitationsApi.revoke(id, userId);
      await loadInvitations();
      set({ status: 'success' });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  createRight: async (data: CreateAccessRightDto) => {
    const { loadRights } = get();
    await accessControlRightsApi.create(mapCreateAccessRightToHouseDomain(data));
    set({ status: 'success' });
    await loadRights();
  },

  deleteRight: async () => {
    const { rightIdToDelete, loadRights } = get();
    if (!rightIdToDelete) return;
    try {
      await accessControlRightsApi.delete(rightIdToDelete);
      await loadRights();
      set({ status: 'success' });
    } catch (error) {
      console.error(error);
      set({ status: 'error' });
    }
  },

  checkAccess: async () => {
    set({ status: 'error' });
  },

  openMemberDetail: (member) => set({ selectedMember: member, memberDetailOpen: true }),

  reset: () => set(initialState),
}));

export function selectEffectiveOwnerId(state: AccessControlState): string | undefined {
  return state.ownerIdFromUrl ?? state.house?.ownerId;
}
