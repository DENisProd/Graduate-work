'use client';

import type { ReactNode } from 'react';
import { useDashboardLayout } from './model/useDashboardLayout';
import { DashboardSidebar, buildDashboardRoutes } from './ui/DashboardSidebar';
import { DashboardHeader } from './ui/DashboardHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useHousePermissions } from '@/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    t,
    pathname,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedGroups,
    toggleGroup,
    isActive,
    selectedHouseId,
    selectedHouseName,
    userHouses,
    isFullWidthPage,
    isAdmin,
  } = useDashboardLayout();

  const perms = useHousePermissions();
  const houseNavPerms = selectedHouseId
    ? { canEditRoles: perms.canEditRoles, isOwner: perms.isOwner }
    : undefined;

  const routes = buildDashboardRoutes(
    t,
    selectedHouseId,
    selectedHouseName,
    userHouses,
    pathname,
    houseNavPerms,
    isAdmin,
  );

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
    >
      <div className="relative flex h-screen w-full overflow-hidden">
        <DashboardSidebar
          routes={routes}
          isActive={isActive}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          t={t}
          selectedHouseId={selectedHouseId}
          selectedHouseName={selectedHouseName}
        />

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            t={t}
            selectedHouseId={selectedHouseId}
            selectedHouseName={selectedHouseName}
          />

          <main
            className={`flex-1 overflow-auto bg-content-area ${isFullWidthPage ? 'overflow-hidden' : ''}`}
          >
            {isFullWidthPage ? (
              children
            ) : (
              <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
                {children}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

