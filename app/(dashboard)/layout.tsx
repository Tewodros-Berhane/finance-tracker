import type { ReactNode } from "react"

import { AddTransactionModal } from "../(dashboard)/transactions/_components/add-transaction-modal"
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

const mockAccounts = [
  { id: "main-checking", name: "Main Checking", currency: "USD" },
  { id: "cash", name: "Cash", currency: "USD" },
]

const mockCategories: { id: string; name: string; type: "INCOME" | "EXPENSE" }[] = [
  { id: "cat-salary", name: "Salary", type: "INCOME" },
  { id: "cat-groceries", name: "Groceries", type: "EXPENSE" },
  { id: "cat-rent", name: "Rent", type: "EXPENSE" },
  { id: "cat-transport", name: "Transport", type: "EXPENSE" },
]

const userId = "demo-user"

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
            <AddTransactionModal
              accounts={mockAccounts}
              categories={mockCategories}
              userId={userId}
              trigger={
                <Button variant="outline" size="sm">
                  Quick Add
                </Button>
              }
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
