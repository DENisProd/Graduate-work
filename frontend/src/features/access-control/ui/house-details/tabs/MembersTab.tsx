'use client';

import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import { Home, Lock, Mail, Shield, UserPlus } from 'lucide-react';
import { InvitationsBlock } from './InvitationsBlock';

interface MembersTabProps {
  onAddMember: () => void;
  /** Открыть модалку приглашения по email (если не передано — вызывается setInvitationModalOpen из стора) */
  onInvite?: () => void;
  onMemberClick: (member: import('@/types/api').HouseMemberResponse) => void;
  onRemoveMember: (member: import('@/types/api').HouseMemberResponse) => void;
}

export function MembersTab({
  onAddMember,
  onInvite,
  onMemberClick,
  onRemoveMember,
}: MembersTabProps) {
  const { t } = useTranslation();
  const members = useAccessControlStore((s) => s.members);
  const invitations = useAccessControlStore((s) => s.invitations);
  const setInvitationModalOpen = useAccessControlStore((s) => s.setInvitationModalOpen);
  const openInviteModal = onInvite ?? (() => setInvitationModalOpen(true));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.accessControl.members')}
        </h3>
        <div className="flex items-center gap-2">
          <AppButton onClick={onAddMember} variant="secondary">
            <UserPlus className="size-4" />
            {t('admin.accessControl.addMember')}
          </AppButton>
          <AppButton onClick={openInviteModal} variant="secondary">
            <Mail className="size-4" />
            {t('admin.accessControl.inviteMember')}
          </AppButton>
        </div>
      </div>
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-md transition-all hover:border-accent/40 hover:shadow-lg"
              onClick={() => onMemberClick(member)}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{member.userId}</p>
                {member.roles.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {member.roles.map((role) => (
                      <span
                        key={role.memberRoleId}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        <Shield className="size-3 shrink-0" />
                        {role.name}
                        {role.permissions.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-px text-[10px] font-semibold leading-none">
                            <Lock className="size-2.5" />
                            {role.permissions.length}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {member.houseName && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Home className="size-3 shrink-0" />
                    {member.houseName}
                  </p>
                )}
              </div>
              <AppButton
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMember(member);
                }}
              >
                {t('admin.delete')}
              </AppButton>
            </div>
          ))}
        </div>
      )}
      {invitations.length > 0 && (
        <div className="border-t border-border pt-4">
          <InvitationsBlock />
        </div>
      )}
    </div>
  );
}
