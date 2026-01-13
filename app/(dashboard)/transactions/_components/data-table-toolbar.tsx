"use client"

import { Trash2, X } from "lucide-react"
import type { Table } from "@tanstack/react-table"
import { toast } from "sonner"

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
  const isFiltered = [
    table.getColumn("description")?.getFilterValue(),
    table.getColumn("accountName")?.getFilterValue(),
    table.getColumn("categoryName")?.getFilterValue(),
    table.getColumn("type")?.getFilterValue(),
  ].some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value !== undefined && value !== null && String(value).length > 0
  })
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleBulkDelete = () => {
    // TODO: Replace this with a server action to delete transactions.
    const selectedIds = selectedRows.map((row) => {
      const original = row.original as { id?: string }
      return original.id ?? ""
    })

    toast.success(`Deleted ${selectedIds.length} transactions.`)
    table.resetRowSelection()
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Search description..."
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
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
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {selectedCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
            className="gap-1"
          >
            Clear
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
