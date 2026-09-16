"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex w-full",
        orientation === "horizontal" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center transition-colors",
  {
    variants: {
      variant: {
        default:
          "w-fit justify-center rounded-lg bg-muted p-[3px] text-muted-foreground h-9",
        line:
          "w-full justify-start border-b border-slate-200 bg-transparent p-0 gap-6 h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
        // Default pill variant
        "group-data-[variant=default]/tabs-list:h-7 group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:py-1",
        "group-data-[variant=default]/tabs-list:text-slate-600 group-data-[variant=default]/tabs-list:hover:text-slate-900",
        "group-data-[variant=default]/tabs-list:data-active:bg-white group-data-[variant=default]/tabs-list:data-active:text-slate-900 group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-white group-data-[variant=default]/tabs-list:data-[state=active]:text-slate-900 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-selected:bg-white group-data-[variant=default]/tabs-list:data-selected:text-slate-900 group-data-[variant=default]/tabs-list:data-selected:shadow-sm",
        "group-data-[variant=default]/tabs-list:aria-selected:bg-white group-data-[variant=default]/tabs-list:aria-selected:text-slate-900 group-data-[variant=default]/tabs-list:aria-selected:shadow-sm",
        // Line bar variant (modern line tab with bottom accent bar)
        "group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-3 group-data-[variant=line]/tabs-list:-mb-px",
        "group-data-[variant=line]/tabs-list:text-slate-500 group-data-[variant=line]/tabs-list:hover:text-slate-900 group-data-[variant=line]/tabs-list:hover:border-slate-300",
        "group-data-[variant=line]/tabs-list:data-active:border-blue-600 group-data-[variant=line]/tabs-list:data-active:text-blue-600 group-data-[variant=line]/tabs-list:data-active:font-semibold",
        "group-data-[variant=line]/tabs-list:data-[state=active]:border-blue-600 group-data-[variant=line]/tabs-list:data-[state=active]:text-blue-600 group-data-[variant=line]/tabs-list:data-[state=active]:font-semibold",
        "group-data-[variant=line]/tabs-list:data-selected:border-blue-600 group-data-[variant=line]/tabs-list:data-selected:text-blue-600 group-data-[variant=line]/tabs-list:data-selected:font-semibold",
        "group-data-[variant=line]/tabs-list:aria-selected:border-blue-600 group-data-[variant=line]/tabs-list:aria-selected:text-blue-600 group-data-[variant=line]/tabs-list:aria-selected:font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none w-full", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
