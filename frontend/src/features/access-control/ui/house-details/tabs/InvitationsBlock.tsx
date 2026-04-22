'use client';

import { Badge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/app-button';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import type { InvitationPermission } from '@/types/api';

function usePermLabel() {
  const { t } = useTranslation();
  return (perm: InvitationPermission): string => {
    switch (perm) {
      case 'INVITE_MEMBERS': return t('admin.accessControl.permInviteMembers');
      case 'EDIT_ROLES': return t('admin.accessControl.permEditRoles');
      case 'MANAGE_DEVICES': return t('admin.accessControl.permManageDevices');
      case 'MANAGE_AUTOMATIONS': return t('admin.accessControl.permManageAutomations');
    }
  };
}

export function InvitationsBlock() {
  const { t } = useTranslation();
  const invitations = useAccessControlStore((s) => s.invitations);
  const revokeInvitation = useAccessControlStore((s) => s.revokeInvitation);
  const permLabel = usePermLabel();

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.accessControl.invitations')}
        </h3>
      </div>

      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div key={String(invitation.id)} className="rounded-xl border border-border bg-card p-4 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">{invitation.email}</p>
                <p className="text-sm text-muted-foreground">{invitation.status}</p>

                {invitation.roleName && (
                  <Badge variant="secondary" className="text-xs">
                    {invitation.roleName}
                  </Badge>
                )}

                {invitation.permissions && invitation.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {invitation.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {permLabel(perm)}
                      </Badge>
                    ))}
                  </div>
                )}

                {invitation.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    {t('admin.accessControl.expiresAt')}:{' '}
                    {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                )}
                {invitation.token && (
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {invitation.token.slice(0, 12)}…
                    </p>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite?token=${encodeURIComponent(invitation.token!)}`;
                        try {
                          void navigator.clipboard.writeText(url);
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                    >
                      {t('admin.accessControl.copyLink')}
                    </AppButton>
                  </div>
                )}
              </div>
              {invitation.status === 'PENDING' && (
                <AppButton
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeInvitation(invitation.id)}
                >
                  {t('admin.accessControl.revokeInvitation')}
                </AppButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
