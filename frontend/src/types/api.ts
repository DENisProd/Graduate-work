// API Types based on OpenAPI documentation

export interface TranslationRequest {
  locale: string;
  name: string;
  description?: string;
}

export interface TranslationResponse {
  locale: string;
  name: string;
  description?: string;
}

// Room Types
export interface RoomRequest {
  code: string;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface RoomResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
}

// Device Type Types
export interface DeviceTypeRequest {
  code: string;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface DeviceTypeResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
  deviceCategories?: DeviceCategoryResponse[];
  deviceFunctions?: DeviceFunctionResponse[];
}

// Device Category Types
export interface DeviceCategoryRequest {
  code: string;
  deviceTypeId: number;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface DeviceCategoryResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  deviceTypeId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
}

// Device Types
export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export interface DeviceRequest {
  code: string;
  name?: string;
  deviceCategoryId: number;
  status?: DeviceStatus;
  serialNumber?: string;
  firmwareVersion?: string;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface DeviceResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  deviceCategoryId?: number;
  deviceCategoryName?: string;
  /** Nested category from admin API (full translations) */
  category?: DeviceCategoryResponse;
  status: DeviceStatus;
  serialNumber?: string;
  firmwareVersion?: string;
  active: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
}

// Device Function Types
export type FunctionType = 'READ' | 'WRITE' | 'READ_WRITE';

export interface DeviceFunctionRequest {
  code: string;
  deviceId: number;
  functionType: FunctionType;
  currentValue?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface DeviceFunctionResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  deviceId: number;
  functionType: FunctionType;
  currentValue?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
  deviceFunctionActions?: DeviceFunctionActionResponse[];
}

// Device Function Action Types
export type ActionType =
  | 'TURN_ON'
  | 'TURN_OFF'
  | 'TOGGLE'
  | 'SET_VALUE'
  | 'INCREASE'
  | 'DECREASE'
  | 'SEND_NOTIFICATION'
  | 'RUN_SCENARIO'
  | 'LOCK'
  | 'UNLOCK'
  | 'CUSTOM_COMMAND';

export interface DeviceFunctionActionRequest {
  code: string;
  deviceFunctionId: number;
  actionType: ActionType;
  payloadTemplate?: string;
  active?: boolean;
  translations: Record<string, TranslationRequest>;
}

export interface DeviceFunctionActionResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  deviceFunctionId: number;
  actionType: ActionType;
  payloadTemplate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Record<string, TranslationResponse>;
}

// Pagination Types
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Access Control Types
export type AccessRightType = 'ALLOW' | 'DENY' | 'READ' | 'WRITE';

/** POST /api/v1/access-rights */
export interface CreateAccessRightDto {
  resourceId: string;
  houseMemberId?: string;
  roleId?: string;
  accessRightType: AccessRightType;
  expiresAt?: string;
}

/**
 * RBAC: ответ GET /api/v1/access-rights/user/{id}, GET /api/v1/resources/{id}/permissions, POST /api/v1/access-rights.
 */
export interface AccessRightResponse {
  id: string;
  resourceId: string;
  houseMemberId?: string;
  roleId?: string;
  accessRightType: AccessRightType;
  parameters?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
}

/** GET /api/v1/access-structure?userId= */
export interface AccessStructureResponse {
  houses: Array<{
    id: string;
    name: string;
    rooms: Array<{
      id: string;
      name?: string;
      externalId?: string;
      devices: Array<{
        id: string;
        externalId?: string;
        functions: Array<{ id: string; externalId?: string }>;
      }>;
    }>;
  }>;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED' | 'EXPIRED';

export interface HouseRequest {
  name: string;
  ownerId: string;
  avatarUrl?: string;
  address?: string;
}

export interface HouseResponse {
  id: number;
  name: string;
  ownerId: string;
  ownerAvatarUrl?: string;
  avatarUrl?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseResourceTreeNode {
  id: number | string;
  type: string;
  parentId?: number | string | null;
  children?: HouseResourceTreeNode[];
}

export interface HouseRoomRequest {
  name: string;
  houseId: number | string;
  parentId?: number | string;
  externalId?: string;
}

export interface HouseRoomResponse {
  id: number | string;
  name?: string;
  externalId?: string;
  houseId: number | string;
  houseName?: string;
  createdAt?: string;
}

/** Request to register a new device in a house (POST /api/v1/houses/{houseId}/devices) */
export interface HouseDeviceRegistrationRequest {
  deviceTypeId: number;
  deviceCategoryId: number;
  name?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export interface HouseDeviceRegistrationResponse {
  id: number;
  houseId: number;
  deviceId: number;
  [key: string]: unknown;
}

export interface HouseMemberRoleBriefDto {
  memberRoleId: string;
  roleId: string;
  name: string;
  priority: number;
  isSystem: boolean;
  permissions: string[];
  assignedAt: string;
}

export interface HouseMemberResponse {
  id: string;
  userId: string;
  userAvatarUrl?: string;
  houseId?: string;
  houseName?: string;
  joinedAt: string;
  roles: HouseMemberRoleBriefDto[];
}

/** Роль дома (для выбора при создании приглашения). GET /api/v1/houses/:houseId/roles */
export interface HouseRoleResponse {
  id: string;
  name?: string;
  code?: string;
  /** Приоритет (меньше — выше в списке). Системные роли обычно первые. */
  priority?: number;
  /** Количество пользователей с этой ролью */
  memberCount?: number;
  /** Системная роль (нельзя редактировать/удалять) */
  system?: boolean;
  /** Доменные разрешения роли (INVITE_MEMBERS, EDIT_ROLES, ...) */
  permissions?: string[];
}

/** Тело запроса создания роли. POST /house-roles */
export interface HouseRoleCreateRequest {
  name: string;
  priority?: number;
}

/** Участник роли (ответ GET /house-roles/:id/members). */
export interface RoleMemberResponse {
  id: number | string;
  userId?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface HousePolicyResponse {
  id: string;
  name?: string;
  effect?: 'ALLOW' | 'DENY' | 'READ' | 'WRITE' | string;
  subjectType?: 'USER' | 'ROLE' | 'MEMBER' | 'ANYONE' | string;
  subjectId?: string;
  resourceId?: string;
  priority?: number;
  condition?: Record<string, unknown>;
}

export interface CreateResourceRequestDto {
  type: 'HOUSE' | 'ROOM' | 'DEVICE' | 'DEVICE_FUNCTION' | 'SCENE' | 'GROUP' | 'AUTOMATION';
  parentId: string;
  name?: string;
  externalId?: string;
}

export interface ResourceResponseDto {
  id: string;
  type?: string;
  parentId?: string;
  name?: string;
  externalId?: string;
}

export interface CreatePolicyRequestDto {
  name: string;
  effect: 'ALLOW' | 'DENY' | 'READ' | 'WRITE';
  subjectType: 'USER' | 'ROLE' | 'MEMBER' | 'ANYONE';
  subjectId?: string;
  resourceId: string;
  condition?: Record<string, unknown>;
  priority: number;
}

export type InvitationPermission =
  | 'INVITE_MEMBERS'
  | 'EDIT_ROLES'
  | 'MANAGE_DEVICES'
  | 'MANAGE_AUTOMATIONS';

/** Права доступа к ресурсам, назначаемые при принятии приглашения. */
export interface InvitationAccessRight {
  accessRightType: AccessRightType;
  deviceId?: number | null;
  deviceFunctionId?: number | null;
  houseRoomId?: number | null;
  parameters?: Record<string, string> | null;
  expiresAt?: string | null;
}

export interface HouseInvitationRequest {
  /** Email приглашаемого (для запроса создания — houseId передаётся в пути) */
  email: string;
  /** Дата истечения приглашения (ISO 8601). По умолчанию бэкенд ставит 7 дней. */
  expiresAt?: string;
  /** ID роли дома для назначения при принятии. Не используйте вместе с permissions/accessRight. */
  roleId?: string;
  /** Явный набор доменных прав. После принятия создаётся кастомная роль. */
  permissions?: InvitationPermission[];
  /** Право доступа к ресурсу, которое будет назначено при принятии приглашения. */
  accessRight?: InvitationAccessRight;
}

/** Тело запроса создания приглашения: только email, roleId?, permissions?, expiresAt? */
export interface CreateInvitationBody {
  email: string;
  roleId?: string;
  permissions?: InvitationPermission[];
  expiresAt?: string;
}

export interface HouseInvitationResponse {
  id: number | string;
  houseId: number | string;
  houseName?: string;
  email: string;
  /** Приходит только в ответе создания приглашения (один раз). */
  token?: string;
  status: InvitationStatus;
  createdAt: string;
  acceptedAt?: string | null;
  expiresAt?: string | null;
  invitedById?: string;
  roleId?: string;
  roleName?: string;
  permissions?: InvitationPermission[];
}

/** Легаси-форма (устройства/комнаты по полям) — предпочтительно {@link HouseAccessRightRequestDto} под OpenAPI. */
export interface HouseAccessRightRequest {
  houseId: number | string;
  houseMemberId: number;
  accessRightType: AccessRightType;
  deviceId?: number | null;
  deviceFunctionId?: number | null;
  houseRoomId?: number | null;
  parameters?: Record<string, string> | null;
  expiresAt?: string | null;
}

/** POST /api/v1/access-control/rights (HouseAccessRightRequestDto в Swagger). */
export interface HouseAccessRightRequestDto {
  resourceId: string;
  houseMemberId?: string;
  houseRoleId?: string;
  accessRightType: AccessRightType;
  parameters?: Record<string, unknown>;
  expiresAt?: string;
}

/** Ответ доменного Access Control (HouseAccessRightResponseDto). */
export interface HouseAccessRightResponse {
  id: string;
  houseId: string;
  houseName?: string;
  houseMemberId?: string;
  houseRoleId?: string;
  houseRoleName?: string;
  userId?: string;
  userName?: string;
  deviceId?: string | null;
  deviceFunctionId?: string | null;
  houseRoomId?: string | null;
  houseRoomName?: string | null;
  accessRightType: AccessRightType;
  parameters?: Record<string, unknown> | null;
  createdAt: string;
  grantedById?: string;
  grantedByName?: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  isActive?: boolean;
}

export interface AccessCheckRequest {
  houseId: number | string;
  userId: string;
  deviceId: number;
  deviceFunctionId?: number | null;
  houseRoomId?: number | null;
  operationType?: string | null;
}

/** POST /api/v1/access-control/check (AccessCheckRequestDto в Swagger). */
export interface AccessControlCheckRequestDto {
  resourceId: string;
  userId: string;
  operationType?: string;
}

export interface AccessCheckRightDetail {
  rightId: number;
  type: AccessRightType;
  deviceId?: number | null;
  deviceFunctionId?: number | null;
  houseRoomId?: number | null;
  isExpired?: boolean;
}

export interface AccessCheckResponse {
  hasAccess: boolean;
  effectiveRightType?: AccessRightType;
  applicableRights?: AccessCheckRightDetail[];
  reason?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface PhysicalDeviceResponse {
  id: string;
  name: string;
  description?: string | null;
  deviceTypeId: number;
  houseId: number;
  deviceId?: string | null;
  roomId?: string | null;
  firmwareVersion?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  serialNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

export interface DeviceDataResponse {
  id: string;
  deviceId?: string | null;
  deviceTypeId: number;
  deviceFunction: string;
  type: 'FLOAT' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  unit?: string | null;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description?: string | null;
  houseId: number;
  createdAt: string;
  updatedAt: string;
  status: 'OFFLINE' | 'ONLINE' | 'ERROR';
  creatorId: string;
  isActive?: boolean;
  lastRun?: string;
}
