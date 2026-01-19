"use client"

import Link from "next/link"
import { Fragment } from "react"
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
  const crumbs: Array<{
    label: string
    href?: string
    current?: boolean
    muted?: boolean
  }> = [
    {
      label: meta.group,
      muted: true,
    },
  ]

  if (trailSegments.length === 0) {
    crumbs.push({
      label: meta.label,
      current: true,
    })
  } else {
    crumbs.push({
      label: meta.label,
      href: `/${baseSegment}`,
    })

    trailSegments.forEach((segment, index) => {
      const href = `/${[
        baseSegment,
        ...trailSegments.slice(0, index + 1),
      ].join("/")}`
      const label = formatSegment(segment)
      const isLast = index === trailSegments.length - 1

      crumbs.push({
        label,
        href: isLast ? undefined : href,
        current: isLast,
      })
    })
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbItem>
              {crumb.current ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {crumb.label}
                </span>
              )}
            </BreadcrumbItem>
            {index < crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
