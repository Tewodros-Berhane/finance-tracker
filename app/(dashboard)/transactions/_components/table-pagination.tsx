"use client"

import { useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

type TablePaginationProps = {
  currentPage: number
  totalPages: number
}

type PageItem = number | "ellipsis"

const buildPageItems = (currentPage: number, totalPages: number): PageItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ])

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: PageItem[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push("ellipsis")
    }
    items.push(page)
  })

  return items
}

export function TablePagination({
  currentPage,
  totalPages,
}: TablePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const clampedPage =
    totalPages > 0
      ? Math.min(Math.max(currentPage, 1), totalPages)
      : 1

  const pageItems = useMemo(
    () => buildPageItems(clampedPage, totalPages),
    [clampedPage, totalPages]
  )

  if (totalPages <= 1) {
    return null
  }

  const createHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(page))
    }

    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const navigateTo = (page: number) => {
    startTransition(() => {
      router.push(createHref(page))
    })
  }

  const prefetchPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    router.prefetch(createHref(page))
  }

  const isPrevDisabled = clampedPage <= 1
  const isNextDisabled = clampedPage >= totalPages

  return (
    <Pagination
      className={cn("justify-end", isPending && "opacity-70")}
      aria-busy={isPending}
    >
      <PaginationContent className="flex-wrap justify-end">
        <PaginationItem>
          <PaginationPrevious
            href={createHref(clampedPage - 1)}
            onClick={(event) => {
              if (isPrevDisabled) {
                event.preventDefault()
                return
              }
              event.preventDefault()
              navigateTo(clampedPage - 1)
            }}
            onMouseEnter={() => prefetchPage(clampedPage - 1)}
            aria-disabled={isPrevDisabled}
            className={cn(
              isPrevDisabled && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
        {pageItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <PaginationItem
                key={`ellipsis-${index}`}
                className="hidden sm:inline-flex"
              >
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={item} className="hidden sm:inline-flex">
              <PaginationLink
                href={createHref(item)}
                isActive={item === clampedPage}
                onClick={(event) => {
                  event.preventDefault()
                  if (item !== clampedPage) {
                    navigateTo(item)
                  }
                }}
                onMouseEnter={() => prefetchPage(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            href={createHref(clampedPage + 1)}
            onClick={(event) => {
              if (isNextDisabled) {
                event.preventDefault()
                return
              }
              event.preventDefault()
              navigateTo(clampedPage + 1)
            }}
            onMouseEnter={() => prefetchPage(clampedPage + 1)}
            aria-disabled={isNextDisabled}
            className={cn(
              isNextDisabled && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
