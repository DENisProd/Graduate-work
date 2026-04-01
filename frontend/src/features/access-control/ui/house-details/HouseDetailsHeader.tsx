"use client";

import { RoleBadge } from "@/components/ui/role-badge";
import { Home } from "lucide-react";

interface HouseDetailsHeaderProps {
  houseName: string;
  role: 'owner' | 'member';
  isAdmin: boolean;
  ownerId?: string;
}

export function HouseDetailsHeader({
  houseName,
  role,
  isAdmin,
  ownerId,
}: HouseDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Home className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{houseName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {isAdmin ? (
              <span className="text-xs text-muted-foreground">
                Owner ID: {ownerId ?? '—'}
              </span>
            ) : (
              <RoleBadge role={role} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
