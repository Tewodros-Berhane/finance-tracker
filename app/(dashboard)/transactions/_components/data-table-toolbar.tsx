"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter, type FacetedFilterOption } from "./data-table-faceted-filter"

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  accounts: FacetedFilterOption[]
  categories: FacetedFilterOption[]
  types: FacetedFilterOption[]
}

export function DataTableToolbar<TData>({
  table,
  accounts,
  categories,
  types,
}: DataTableToolbarProps<TData>) {
  const descriptionColumn = table.getColumn("description")
  const descriptionFilter =
    (descriptionColumn?.getFilterValue() as string) ?? ""
  const [searchValue, setSearchValue] = React.useState(descriptionFilter)

  React.useEffect(() => {
    setSearchValue(descriptionFilter)
  }, [descriptionFilter])

  const isFiltered = [
    descriptionFilter,
    table.getColumn("accountName")?.getFilterValue(),
    table.getColumn("categoryName")?.getFilterValue(),
    table.getColumn("type")?.getFilterValue(),
  ].some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value !== undefined && value !== null && String(value).length > 0
  })
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Search description..."
          value={searchValue}
          onChange={(event) => {
            const nextValue = event.target.value
            setSearchValue(nextValue)
            descriptionColumn?.setFilterValue(nextValue)
          }}
          className="h-9 w-full sm:max-w-xs"
        />
        {table.getColumn("accountName") && (
          <DataTableFacetedFilter
            column={table.getColumn("accountName")}
            title="Account"
            options={accounts}
          />
        )}
        {table.getColumn("categoryName") && (
          <DataTableFacetedFilter
            column={table.getColumn("categoryName")}
            title="Category"
            options={categories}
          />
        )}
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={types}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-9"
          >
            {/* <X className="size-4" /> */}
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
