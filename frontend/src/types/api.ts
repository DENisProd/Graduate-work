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

export type AccessRightType = 'ALLOW' | 'DENY' | 'READ' | 'WRITE';

export interface CreateAccessRightDto {
  resourceId: string;
  houseMemberId?: string;
  roleId?: string;
  accessRightType: AccessRightType;
  expiresAt?: string;
}

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
  avatarUrl?: string;
  address?: string;
}

export interface HouseResponse {
  id: number;
  /** Optional UUID/external id used by some access-service routes */
  uuid?: string;
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
  /** Display name (synced from access-service on the client side). */
  userDisplayName?: string;
  userAvatarUrl?: string;
  houseId?: string;
  houseName?: string;
  joinedAt: string;
  roles: HouseMemberRoleBriefDto[];
}

export interface HouseRoleResponse {
  id: string;
  name?: string;
  code?: string;
  priority?: number;
  memberCount?: number;
  system?: boolean;
  permissions?: string[];
}

export interface HouseRoleCreateRequest {
  name: string;
  priority?: number;
}

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

export interface InvitationAccessRight {
  accessRightType: AccessRightType;
  deviceId?: number | null;
  deviceFunctionId?: number | null;
  houseRoomId?: number | null;
  parameters?: Record<string, string> | null;
  expiresAt?: string | null;
}

export interface HouseInvitationRequest {
  note?: string;
  expiresAt?: string;
  roleId?: string;
  permissions?: InvitationPermission[];
  accessRight?: InvitationAccessRight;
}

export interface CreateInvitationBody {
  note?: string;
  roleId?: string;
  permissions?: InvitationPermission[];
  expiresAt?: string;
}

export interface HouseInvitationResponse {
  id: number | string;
  houseId?: number | string;
  houseName?: string;
  note?: string;
  /** Returned only on creation (once). */
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

export interface HouseAccessRightRequestDto {
  resourceId: string;
  houseMemberId?: string;
  houseRoleId?: string;
  accessRightType: AccessRightType;
  parameters?: Record<string, unknown>;
  expiresAt?: string;
}

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

export interface ZigbeeStateMetrics {
  state: string | null;
  brightness: number | null;
  linkquality: number | null;
  colorMode: string | null;
  occupancy: boolean | null;
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
}

export interface ZigbeeStateWire {
  deviceIeeeAddr: string;
  physicalDeviceId: string | null;
  friendlyName: string | null;
  timestamp: string;
  metrics: ZigbeeStateMetrics;
  payload: Record<string, unknown>;
  stateId: string;
}

export interface ZigbeeDeviceListItem {
  id: string;
  ieeeAddr?: string;
  protocolAddress?: string;
  physicalDeviceId?: string;
  networkAddress?: number | null;
  type?: 'Coordinator' | 'Router' | 'EndDevice' | string | null;
  manufacturerName?: string | null;
  modelId?: string | null;
  model?: string | null;
  friendlyName?: string | null;
  name?: string | null;
  lastSeen?: string | null;
  definition?: Record<string, unknown> | null;
  capabilities?: string[];
  houseId?: string | null;
  roomId?: string | null;
}

export interface HouseMqttStatus {
  connected: boolean;
}

export interface HouseMqttConfigResponse {
  houseId: string;
  mqttUrl: string;
  mqttUsername?: string;
  /** Password is not returned by backend. */
  mqttPassword?: undefined;
  topicPrefix: string;
  enabled: boolean;
  status?: HouseMqttStatus;
}

export interface HouseMqttConfigUpsertRequest {
  mqttUrl: string;
  mqttUsername?: string;
  mqttPassword?: string;
  topicPrefix?: string;
  enabled?: boolean;
}

export interface PhysicalDeviceResponse {
  id: string;
  name?: string | null;
  description?: string | null;
  deviceTypeId?: number | null;
  houseId?: string | number | null;
  deviceId?: string | null;
  roomId?: string | null;
  firmwareVersion?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  serialNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR';
  protocolAddress?: string | null;
  networkAddress?: number | null;
  type?: 'Coordinator' | 'Router' | 'EndDevice' | string | null;
  manufacturerName?: string | null;
  model?: string | null;
  friendlyName?: string | null;
  lastSeen?: string | null;
  definition?: Record<string, unknown> | null;
  capabilities?: string[];
}

export interface DeviceDataResponse {
  id: string;
  deviceId: string;
  capability: string;
  attribute?: string | null;
  type: 'FLOAT' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  value: unknown;
  unit?: string | null;
  quality?: number | null;
  timestamp: string;
}

export type DeviceDataSeriesRange = '1m' | '1h' | '6h' | '24h' | '7d';

export interface DeviceDataSeriesPoint {
  ts: string;
  value: number;
}

export interface DeviceDataSeries {
  key: string;
  capability: string;
  attribute?: string | null;
  unit?: string | null;
  points: DeviceDataSeriesPoint[];
}

export interface DeviceDataSeriesResponse {
  from: string;
  to: string;
  series: DeviceDataSeries[];
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description?: string | null;
  houseId: number | string;
  createdAt: string;
  updatedAt: string;
  status: 'OFFLINE' | 'ONLINE' | 'ERROR';
  creatorId: string;
  isActive?: boolean;
  lastRun?: string;
  /** Optional for backward compatibility with older backend payloads. */
  definition?: unknown;
}
