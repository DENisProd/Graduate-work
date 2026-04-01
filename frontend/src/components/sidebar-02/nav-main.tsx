"use client";

import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
  subs?: {
    title: string;
    link: string;
    icon?: React.ReactNode;
    isActive?: boolean;
  }[];
  isActive?: boolean;
};

type DashboardNavigationProps = {
  routes: Route[];
  isActive?: (link: string) => boolean;
  openGroups?: Record<string, boolean>;
  onToggleGroup?: (groupId: string) => void;
};

export default function DashboardNavigation({
  routes,
  isActive,
  openGroups,
  onToggleGroup,
}: DashboardNavigationProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const active = route.isActive ?? (isActive ? isActive(route.link) : false);
        const isOpen = !isCollapsed
          ? openGroups
            ? !!openGroups[route.id]
            : openCollapsible === route.id
          : false;
        const hasSubRoutes = !!route.subs?.length;

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => {
                  if (openGroups) {
                    onToggleGroup?.(route.id);
                  } else {
                    setOpenCollapsible(open ? route.id : null);
                  }
                }}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 transition-colors",
                      isOpen || active
                        ? "bg-sidebar-muted text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    {route.icon}
                    {!isCollapsed && (
                      <span className="ml-2 flex-1 text-sm font-medium">
                        {route.title}
                      </span>
                    )}
                    {!isCollapsed && hasSubRoutes && (
                      <span className="ml-auto">
                        {isOpen ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </span>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <AnimatePresence initial={false}>
                  {!isCollapsed && isOpen && (
                    <motion.div
                      key={`${route.id}-subs`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <SidebarMenuSub className="my-1 ml-3.5">
                        {route.subs?.map((subRoute) => {
                          const subActive =
                            subRoute.isActive ??
                            (isActive ? isActive(subRoute.link) : false);
                          return (
                            <SidebarMenuSubItem
                              key={`${route.id}-${subRoute.title}`}
                              className="h-auto"
                            >
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                className={cn(
                                  "h-auto items-start py-1.5 text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                                  "[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:line-clamp-none"
                                )}
                              >
                                <Link href={subRoute.link} prefetch={true}>
                                  {subRoute.icon && (
                                    <span className="mr-2 inline-flex">
                                      {subRoute.icon}
                                    </span>
                                  )}
                                  {subRoute.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>
            ) : (
              <SidebarMenuButton tooltip={route.title} asChild>
                <Link
                  href={route.link}
                  prefetch={true}
                  className={cn(
                    "flex items-center rounded-lg px-2 transition-colors",
                    active
                      ? "bg-sidebar-muted text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                    isCollapsed && "justify-center"
                  )}
                >
                  {route.icon}
                  {!isCollapsed && (
                    <span className="ml-2 text-sm font-medium">
                      {route.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
