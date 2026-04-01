/**
 * Access Control — FSD slice (Feature-Sliced Design).
 * Public API: only these exports should be used by app/pages.
 */

export { AccessControlPageContent } from './ui/AccessControlPageContent';
export { AccessControlHouses } from './ui/AccessControlHouses';
export { MyHousesList } from './ui/MyHousesList';
export { HouseDetailsModals } from './ui/HouseDetailsModals';
export {
  AccessControlHousePanel,
  type HousePanelSubpage,
} from './ui/AccessControlHousePanel';

export {
  HouseFormModal,
  RoomFormModal,
  MemberFormModal,
  MemberDetailModal,
  InvitationFormModal,
  AccessRightFormModal,
  AddDeviceModal,
} from './ui/modals';

export { toArray, getAccessTypeLabel, formatDate, toDateTimeLocal, getDisplayName } from './lib/utils';
