"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const formatSegment = (segment: string) =>
  segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const routeMeta: Record<
  string,
  {
    group: "Main" | "Management" | "System"
    label: string
  }
> = {
  dashboard: { group: "Main", label: "Dashboard" },
  transactions: { group: "Main", label: "Transactions" },
  accounts: { group: "Management", label: "Accounts" },
  budgets: { group: "Management", label: "Budgets" },
  goals: { group: "Management", label: "Goals" },
  categories: { group: "System", label: "Categories" },
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const baseSegment = segments[0] ?? "dashboard"
  const meta = routeMeta[baseSegment] ?? {
    group: "Main",
    label: formatSegment(baseSegment),
  }
  const trailSegments = segments.slice(1)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground text-sm">{meta.group}</span>
          <BreadcrumbSeparator />
        </BreadcrumbItem>

        {trailSegments.length === 0 ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{meta.label}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${baseSegment}`}>{meta.label}</Link>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
            {trailSegments.map((segment, index) => {
              const href = `/${[
                baseSegment,
                ...trailSegments.slice(0, index + 1),
              ].join("/")}`
              const label = formatSegment(segment)
              const isLast = index === trailSegments.length - 1

              return (
                <BreadcrumbItem key={href}>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{label}</Link>
                    </BreadcrumbLink>
                  )}
                  {!isLast && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              )
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
