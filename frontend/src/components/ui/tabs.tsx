"use client"

import * as React from "react"

import {
  Tabs as AnimatedTabs,
  TabsList as AnimatedTabsList,
  TabsTrigger as AnimatedTabsTrigger,
  TabsContent as AnimatedTabsContent,
} from "@/components/animate-ui/components/radix/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof AnimatedTabs>) {
  return (
    <AnimatedTabs data-slot="tabs" className={cn(className)} {...props} />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof AnimatedTabsList>) {
  return (
    <AnimatedTabsList
      data-slot="tabs-list"
      className={cn(className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof AnimatedTabsTrigger>) {
  return (
    <AnimatedTabsTrigger
      data-slot="tabs-trigger"
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof AnimatedTabsContent>) {
  return (
    <AnimatedTabsContent
      data-slot="tabs-content"
      className={cn(
        "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
