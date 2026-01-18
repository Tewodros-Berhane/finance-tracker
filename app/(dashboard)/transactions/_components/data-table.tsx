"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { useReactTable } from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

type CursorPagination = {
  mode: "cursor"
  pageSize: number
  rowCount: number
  hasNext: boolean
  hasPrev: boolean
  onNext: () => void
  onPrev: () => void
  onPageSizeChange: (pageSize: number) => void
}

type OffsetPagination = {
  mode?: "offset"
  pageIndex: number
  pageSize: number
  pageCount: number
  total: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar: Omit<React.ComponentProps<typeof DataTableToolbar>, "table">
  pagination?: CursorPagination | OffsetPagination
  meta?: {
    onEdit?: (row: TData) => void
    onDelete?: (row: TData) => void
  }
}

type ColumnMeta = {
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  pagination,
  meta,
}: DataTableProps<TData, TValue>) {
  const isCursorPagination = pagination?.mode === "cursor"
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const paginationState = React.useMemo(() => {
    if (!pagination || isCursorPagination) return undefined
    return {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    }
  }, [isCursorPagination, pagination])
  const pageCount =
    !isCursorPagination && pagination ? pagination.pageCount : undefined

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    manualPagination: Boolean(pagination) && !isCursorPagination,
    pageCount,
    meta,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(paginationState ? { pagination: paginationState } : {}),
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (!pagination || !paginationState || isCursorPagination) return
      const next =
        typeof updater === "function" ? updater(paginationState) : updater

      if (next.pageIndex !== pagination.pageIndex) {
        pagination.onPageChange(next.pageIndex)
      }

      if (next.pageSize !== pagination.pageSize) {
        pagination.onPageSizeChange(next.pageSize)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row, index) =>
      (row as { id?: string }).id ?? String(index),
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} {...toolbar} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | ColumnMeta
                    | undefined

                  return (
                    <TableHead
                      key={header.id}
                      className={meta?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | ColumnMeta
                      | undefined

                    return (
                      <TableCell
                        key={cell.id}
                        className={meta?.className}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} pagination={pagination} />
    </div>
  )
}
