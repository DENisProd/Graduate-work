'use client';

import type { ReactNode } from 'react';
import { useAdminLayout } from './model/useAdminLayout';
import { AdminSidebar } from './ui/AdminSidebar';
import { AdminHeader } from './ui/AdminHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const {
    t,
    pathname,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedGroups,
    toggleGroup,
    navItems,
    isActive,
    selectedDeviceId,
    selectedDeviceName,
    selectedHouseId,
    selectedHouseName,
    isFullWidthPage,
  } = useAdminLayout();

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
    >
      <div className="relative flex h-screen w-full overflow-hidden">
        <AdminSidebar
          navItems={navItems}
          isActive={isActive}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          selectedDeviceId={selectedDeviceId}
          selectedHouseId={selectedHouseId}
          selectedHouseName={selectedHouseName}
          pathname={pathname}
          t={t}
        />

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            t={t}
            selectedDeviceId={selectedDeviceId}
            selectedDeviceName={selectedDeviceName}
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
