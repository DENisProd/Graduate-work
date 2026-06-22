'use client';

import { MemberAvatar } from '@/components/shared/MemberAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks';
import type { RoleMemberResponse } from '@/types/api';

interface Props {
  loading: boolean;
  members: RoleMemberResponse[];
  embedded?: boolean;
}

export function RoleMembersTable({ loading, members, embedded = false }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={embedded ? 'space-y-2' : 'mt-2 flex items-center gap-2'}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 flex-1" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className={embedded ? 'text-xs text-muted-foreground' : 'mt-2 text-xs text-muted-foreground'}>
        {t('admin.noData')}
      </p>
    );
  }

  if (embedded) {
    return (
      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2"
          >
            <MemberAvatar
              size="sm"
              src={member.avatarUrl}
              name={member.name ?? undefined}
              alt={String(member.name ?? member.userId ?? member.id)}
            />
            <span className="min-w-0 truncate text-sm text-foreground">
              {member.name ?? member.userId ?? member.id}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Table className="mt-2">
      <TableHeader>
        <TableRow>
          <TableHead className="w-9" />
          <TableHead>{t('admin.accessControl.members')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="w-9">
              <MemberAvatar
                size="sm"
                src={member.avatarUrl}
                name={member.name ?? undefined}
                alt={String(member.name ?? member.userId ?? member.id)}
              />
            </TableCell>
            <TableCell>{member.name ?? member.userId ?? member.id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

