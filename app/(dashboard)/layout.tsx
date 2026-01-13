import type { Metadata } from "next"
import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AddTransactionModal } from "../(dashboard)/transactions/_components/add-transaction-modal"
import { AppSidebar } from "@/components/modules/app-sidebar"
import { CurrencyRefresh } from "@/components/modules/currency-refresh"
import { DashboardBreadcrumbs } from "@/components/modules/dashboard-breadcrumbs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/services/auth.service"

type DashboardLayoutProps = {
  children: ReactNode
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const [accounts, categories] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const modalAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    currency: account.currency ?? "USD",
  }))

  const modalCategories = categories
    .filter(
      (category): category is { id: string; name: string; type: "INCOME" | "EXPENSE" } =>
        category.type === "INCOME" || category.type === "EXPENSE"
    )
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }))
  return (
    <SidebarProvider>
      <CurrencyRefresh />
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <DashboardBreadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <AddTransactionModal
              accounts={modalAccounts}
              categories={modalCategories}
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
