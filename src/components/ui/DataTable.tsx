import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  pageSize?: number;
  globalFilter?: string;
  className?: string;
}

export default function DataTable<T>({
  data,
  columns,
  pageSize = 25,
  globalFilter,
  className = '',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-auto scrollbar-thin flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-surface z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="table-header cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === 'asc' && (
                        <ChevronUp size={12} className="text-accent" />
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <ChevronDown size={12} className="text-accent" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="table-row">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="table-cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-1.5 border-t border-border bg-surface">
        <span className="text-2xs text-tertiary">
          {table.getFilteredRowModel().rows.length} records
        </span>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-tertiary mr-2">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-0.5 rounded text-tertiary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-0.5 rounded text-tertiary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-0.5 rounded text-tertiary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-0.5 rounded text-tertiary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
