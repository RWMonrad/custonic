"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

export type Column<T = Record<string, unknown>> = {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown> & { id: string }>({
  data,
  columns,
  onRowClick,
  selectedRowId,
  searchable = true,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedData = data
    .filter((row) => {
      if (!searchTerm) return true;
      return columns.some((column) => {
        const value = row[column.key];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    })
    .sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const getSortIcon = (column: keyof T) => {
    if (sortColumn !== column) return null;
    if (sortDirection === "asc") return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === "desc") return <ChevronDown className="h-4 w-4" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{data.length} items</CardTitle>
          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-4 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.key.toString()}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:text-foreground",
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedData.map((row) => (
                <tr
                  key={row.id as string}
                  className={cn(
                    "hover:bg-background cursor-pointer transition-colors",
                    selectedRowId === row.id && "bg-primary/5",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key.toString()}
                      className="px-4 py-3 whitespace-nowrap text-sm"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : (row[column.key] as React.ReactNode)}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No results found" : "No data available"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
