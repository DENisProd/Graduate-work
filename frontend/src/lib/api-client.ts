// Re-export shim — all implementations live in ./api/*

export { ApiError, USE_MOCKS, API_BASE_URL, ACCESS_API_BASE_URL, PHYSICAL_DEVICES_API_BASE_URL } from './api/core';

export {
  roomsApi,
  deviceTypesApi,
  deviceCategoriesApi,
  devicesApi,
  deviceFunctionsApi,
  deviceFunctionActionsApi,
} from './api/device-service';

export {
  housesApi,
  houseRoomsApi,
  houseMembersApi,
  houseRolesApi,
  houseInvitationsApi,
  accessControlRightsApi,
  accessRightsApi,
  accessApiClient,
  mapCreateAccessRightToHouseDomain,
  fetchAccessControlRightsByMember,
  fetchAccessControlRightsByHouse,
  fetchRbacAccessRightsByUser,
  deleteRbacAccessRight,
  fetchRbacAccessRightsByResource,
} from './api/access-service';

export {
  houseDevicesApi,
  zigbeeDevicesApi,
  houseMqttApi,
  physicalDevicesApi,
  deviceDataApi,
  scenariosApi,
} from './api/scenario-service';
