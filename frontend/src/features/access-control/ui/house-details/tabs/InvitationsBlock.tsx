'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/app-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks';
import { useAccessControlStore } from '@/store/access-control-store';
import type { InvitationPermission } from '@/types/api';
import QRCode from 'react-qr-code';
import { Check, Copy } from 'lucide-react';

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

function formatInvitationStatus(status: string, locale?: string): string {
  const ru = locale === 'ru';
  switch (status) {
    case 'PENDING': return ru ? 'Ожидает' : 'Pending';
    case 'ACCEPTED': return ru ? 'Принято' : 'Accepted';
    case 'DECLINED': return ru ? 'Отклонено' : 'Declined';
    case 'REVOKED': return ru ? 'Отозвано' : 'Revoked';
    case 'EXPIRED': return ru ? 'Истекло' : 'Expired';
    default: return status;
  }
}

export function InvitationsBlock() {
  const { t, locale } = useTranslation();
  const invitations = useAccessControlStore((s) => s.invitations);
  const revokeInvitation = useAccessControlStore((s) => s.revokeInvitation);
  const permLabel = usePermLabel();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    if (!selectedToken) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite?token=${encodeURIComponent(selectedToken)}`;
  }, [selectedToken]);

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
              <button
                type="button"
                className="min-w-0 flex-1 space-y-1 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
                onClick={() => {
                  if (invitation.token) setSelectedToken(invitation.token);
                }}
                disabled={!invitation.token}
                aria-disabled={!invitation.token}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {invitation.note?.trim() || invitation.houseName || (locale === 'ru' ? 'Приглашение' : 'Invitation')}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {formatInvitationStatus(invitation.status, locale)}
                  </Badge>
                </div>

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
              </button>
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

      <Dialog open={Boolean(selectedToken)} onOpenChange={(open) => (!open ? setSelectedToken(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.accessControl.copyLink')}</DialogTitle>
            <DialogDescription>
              {t('admin.accessControl.invitations')}
            </DialogDescription>
          </DialogHeader>

          {inviteUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative rounded-md border border-border bg-muted/30 p-3 pr-11">
                  <p className="font-mono text-xs text-muted-foreground break-all">{inviteUrl}</p>
                  <button
                    type="button"
                    aria-label={t('admin.accessControl.copyLink')}
                    className={[
                      'absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md',
                      'text-muted-foreground transition-colors',
                      'hover:bg-background/60 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      copied ? 'text-emerald-600' : '',
                    ].join(' ')}
                    onClick={() => {
                      try {
                        void navigator.clipboard.writeText(inviteUrl);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 900);
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    {copied ? (
                      <Check className="copy-pop h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center rounded-lg border border-border bg-card p-4">
                <QRCode value={inviteUrl} size={180} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
