'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { SkeletonTableRow } from '@/components/skeleton';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  expandable = false,
  renderExpanded,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(
    new Set()
  );

  const handleSort = (column: string) => {
    if (!column) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc';
    }

    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const toggleExpanded = (key: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <tbody className="divide-y divide-[var(--border)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow
                  key={i}
                  cols={columns.length + (expandable ? 1 : 0)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-[var(--border)] md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="p-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Desktop View */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)]">
            <tr>
              {expandable && <th className="w-12 px-4 py-3" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 transition-colors hover:text-[var(--foreground)]"
                    >
                      {column.label}
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((row) => {
              const key = keyExtractor(row);
              const isExpanded = expandedRows.has(key);

              return (
                <tbody key={key}>
                  <tr className="transition-colors hover:bg-[var(--surface-2)]">
                    {expandable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpanded(key)}
                          className="rounded p-1 transition-colors hover:bg-[var(--border)]"
                          aria-label="Expand row"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : String(row[column.key as keyof T])}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded && renderExpanded && (
                    <tr className="bg-[var(--surface-2)]">
                      <td colSpan={columns.length + 1} className="px-4 py-4">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden">
        <div className="divide-y divide-[var(--border)]">
          {data.map((row) => {
            const key = keyExtractor(row);
            const isExpanded = expandedRows.has(key);

            return (
              <div key={key} className="p-4">
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                        {column.label}
                      </span>
                      <span className="flex-1 text-right text-sm">
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : String(row[column.key as keyof T])}
                      </span>
                    </div>
                  ))}
                </div>
                {expandable && (
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
                {expandable && isExpanded && renderExpanded && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    {renderExpanded(row)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
