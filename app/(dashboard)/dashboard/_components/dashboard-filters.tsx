"use client"

import * as React from "react"
import { format, endOfMonth, parseISO, startOfMonth, subDays } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const accountOptions = [
  { value: "all", label: "All Accounts" },
  { value: "main-checking", label: "Main Checking" },
  { value: "cash", label: "Cash" },
  { value: "savings", label: "Savings" },
]

const formatParamDate = (date: Date) => format(date, "yyyy-MM-dd")

const parseParamDate = (value: string | null) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const getRangeFromParams = (params: URLSearchParams): DateRange | undefined => {
  const from = parseParamDate(params.get("from"))
  const to = parseParamDate(params.get("to"))

  if (!from && !to) return undefined
  return { from, to }
}

export function DashboardFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [range, setRange] = React.useState<DateRange | undefined>(() =>
    getRangeFromParams(new URLSearchParams(searchParams.toString()))
  )
  const [account, setAccount] = React.useState(
    searchParams.get("account") || "all"
  )

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    setRange(getRangeFromParams(params))
    setAccount(params.get("account") || "all")
  }, [searchParams])

  const updateParams = React.useCallback(
    (updates: { from?: string | null; to?: string | null; account?: string }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.from !== undefined) {
        if (updates.from) {
          params.set("from", updates.from)
        } else {
          params.delete("from")
        }
      }

      if (updates.to !== undefined) {
        if (updates.to) {
          params.set("to", updates.to)
        } else {
          params.delete("to")
        }
      }

      if (updates.account !== undefined) {
        if (updates.account && updates.account !== "all") {
          params.set("account", updates.account)
        } else {
          params.delete("account")
        }
      }

      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
    setRange(nextRange)

    if (nextRange?.from && nextRange?.to) {
      updateParams({
        from: formatParamDate(nextRange.from),
        to: formatParamDate(nextRange.to),
      })
    }
  }

  const handlePreset = (preset: "7" | "30" | "month") => {
    const now = new Date()
    const nextRange =
      preset === "month"
        ? { from: startOfMonth(now), to: endOfMonth(now) }
        : {
            from: subDays(now, preset === "7" ? 6 : 29),
            to: now,
          }

    setRange(nextRange)
    updateParams({
      from: formatParamDate(nextRange.from),
      to: formatParamDate(nextRange.to),
    })
  }

  const handleAccountChange = (value: string) => {
    setAccount(value)
    updateParams({ account: value })
  }

  const rangeLabel = range?.from
    ? range.to
      ? `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`
      : format(range.from, "MMM dd")
    : "Date range"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="size-4" />
            {rangeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <div className="flex flex-wrap gap-2 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handlePreset("7")}
            >
              Last 7 Days
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handlePreset("30")}
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handlePreset("month")}
            >
              This Month
            </Button>
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={handleRangeSelect}
          />
        </PopoverContent>
      </Popover>

      <Select value={account} onValueChange={handleAccountChange}>
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="All Accounts" />
        </SelectTrigger>
        <SelectContent>
          {accountOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

