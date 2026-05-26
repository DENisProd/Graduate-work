'use client';

import { useAccessControlStore } from '@/store/access-control-store';
import { useHousePermissions } from '@/hooks';
import { MembersTab } from '@/features/access-control/ui/house-details';

export default function HouseMembersPage() {
  const setMemberModalOpen = useAccessControlStore((s) => s.setMemberModalOpen);
  const openMemberDetail = useAccessControlStore((s) => s.openMemberDetail);
  const removeMember = useAccessControlStore((s) => s.removeMember);
  const perms = useHousePermissions();

  return (
    <MembersTab
      onAddMember={() => setMemberModalOpen(true)}
      onMemberClick={openMemberDetail}
      onRemoveMember={(member) => removeMember(member.userId)}
      canInvite={perms.canInviteMembers}
      canRemove={perms.isOwner || perms.canInviteMembers}
    />
  );
}
