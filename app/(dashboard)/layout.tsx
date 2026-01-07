import type { ReactNode } from "react"

import { AppSidebar } from "@/components/modules/app-sidebar"
import { DashboardBreadcrumbs } from "@/components/modules/dashboard-breadcrumbs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <DashboardBreadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Quick Add
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

