"use client"

import { Check, Filter } from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type FacetedFilterOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>
  title: string
  options: FacetedFilterOption[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set<string>(
    (column?.getFilterValue() as string[]) ?? []
  )

  const toggleValue = (value: string) => {
    const next = new Set(selectedValues)

    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }

    const values = Array.from(next)
    column?.setFilterValue(values.length ? values : undefined)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    value: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggleValue(value)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Filter className="size-4" />
          {title}
          {selectedValues.size > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-md px-2 py-0">
              {selectedValues.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value)
            const Icon = option.icon

            return (
              <div
                key={option.value}
                onClick={() => toggleValue(option.value)}
                onKeyDown={(event) => handleKeyDown(event, option.value)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  isSelected && "bg-accent"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  aria-hidden
                  className="pointer-events-none"
                />
                {Icon && <Icon className="text-muted-foreground size-4" />}
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && <Check className="text-muted-foreground size-4" />}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
