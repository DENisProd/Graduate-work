"use client";

import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
  section?: string;
  subs?: SubRoute[];
  isActive?: boolean;
};

type SubRoute = {
  title: string;
  link: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  subs?: SubRoute[];
};

type DashboardNavigationProps = {
  routes: Route[];
  isActive?: (link: string) => boolean;
  openGroups?: Record<string, boolean>;
  onToggleGroup?: (groupId: string) => void;
};

function RouteItem({
  route,
  isActive,
  openGroups,
  onToggleGroup,
  isCollapsed,
  openCollapsible,
  setOpenCollapsible,
}: {
  route: Route;
  isActive?: (link: string) => boolean;
  openGroups?: Record<string, boolean>;
  onToggleGroup?: (groupId: string) => void;
  isCollapsed: boolean;
  openCollapsible: string | null;
  setOpenCollapsible: (id: string | null) => void;
}) {
  const active = route.isActive ?? (isActive ? isActive(route.link) : false);
  const isOpen = !isCollapsed
    ? openGroups
      ? !!openGroups[route.id]
      : openCollapsible === route.id
    : false;
  const hasSubRoutes = !!route.subs?.length;

  const activeClass =
    "bg-primary/10 text-primary font-medium [&_svg]:text-primary";
  const inactiveClass =
    "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  if (hasSubRoutes) {
    return (
      <SidebarMenuItem>
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
              tooltip={isCollapsed ? route.title : undefined}
              className={cn(
                "flex w-full items-center rounded-lg px-3 h-9 transition-colors",
                isOpen || active ? activeClass : inactiveClass,
                isCollapsed && "justify-center px-2"
              )}
            >
              {route.icon}
              {!isCollapsed && (
                <span className="ml-2 flex-1 text-sm">{route.title}</span>
              )}
              {!isCollapsed && (
                <ChevronDown
                  className={cn(
                    "ml-auto size-3.5 text-muted-foreground/70 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
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
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <SidebarMenuSub className="my-1 ml-4 border-l border-border/50 pl-2 space-y-0.5">
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
                            "h-auto py-1.5 rounded-md transition-colors text-sm",
                            subActive
                              ? "text-primary font-medium bg-primary/8 [&_svg]:text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <Link href={subRoute.link} prefetch={true}>
                            {subRoute.icon && (
                              <span className="mr-1.5 inline-flex shrink-0">
                                {subRoute.icon}
                              </span>
                            )}
                            <span>{subRoute.title}</span>
                          </Link>
                        </SidebarMenuSubButton>

                        {!!subRoute.subs?.length && (
                          <ul className="mt-1 ml-4 space-y-0.5 border-l border-border/40 pl-2">
                            {subRoute.subs.map((nested) => {
                              const nestedActive =
                                nested.isActive ??
                                (isActive ? isActive(nested.link) : false);
                              return (
                                <li key={`${route.id}-${subRoute.title}-${nested.title}`}>
                                  <SidebarMenuSubButton
                                    asChild
                                    size="sm"
                                    isActive={nestedActive}
                                    className={cn(
                                      "h-auto py-1.5 rounded-md transition-colors",
                                      nestedActive
                                        ? "text-primary font-medium bg-primary/8 [&_svg]:text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                  >
                                    <Link href={nested.link} prefetch={true}>
                                      {nested.icon && (
                                        <span className="mr-1.5 inline-flex shrink-0">
                                          {nested.icon}
                                        </span>
                                      )}
                                      <span>{nested.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={route.title} asChild>
        <Link
          href={route.link}
          prefetch={true}
          className={cn(
            "flex items-center rounded-lg px-3 h-9 transition-colors",
            active ? activeClass : inactiveClass,
            isCollapsed && "justify-center px-2"
          )}
        >
          {route.icon}
          {!isCollapsed && (
            <span className="ml-2 text-sm">{route.title}</span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function DashboardNavigation({
  routes,
  isActive,
  openGroups,
  onToggleGroup,
}: DashboardNavigationProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  const groups: { section: string | undefined; routes: Route[] }[] = [];
  for (const route of routes) {
    const last = groups[groups.length - 1];
    if (!last || last.section !== route.section) {
      groups.push({ section: route.section, routes: [route] });
    } else {
      last.routes.push(route);
    }
  }

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={groupIndex} className="px-0 py-0">
          {group.section && (
            <SidebarGroupLabel className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {group.section}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-1">
              {group.routes.map((route) => (
                <RouteItem
                  key={route.id}
                  route={route}
                  isActive={isActive}
                  openGroups={openGroups}
                  onToggleGroup={onToggleGroup}
                  isCollapsed={isCollapsed}
                  openCollapsible={openCollapsible}
                  setOpenCollapsible={setOpenCollapsible}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
