import type { ReactNode } from "react";

// --- Filter Types ---

export type FilterOperator = "AND" | "OR";

export interface FilterCondition {
  id: string;
  type: "condition";
  column: string;
  regex: string;
  caseSensitive?: boolean;
}

export interface FilterGroup {
  id: string;
  type: "group";
  operator: FilterOperator;
  children: FilterNode[];
}

export type FilterNode = FilterCondition | FilterGroup;

// --- Column Definition ---

export interface ColumnDefinition<T = Record<string, unknown>> {
  /** The key in the data object to access */
  key: keyof T | string;
  /** Display label for the column header */
  label: string;
  /** Column width (CSS value, e.g., "150px", "20%") */
  width?: string;
  /** Minimum column width for resizing (CSS value, default: "50px") */
  minWidth?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  /** Whether this column is resizable (default: true) */
  resizable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  /** CSS class name for the column */
  className?: string;
}

// --- Sorting ---

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

// --- Column Visibility ---

export interface ColumnVisibility {
  [key: string]: boolean;
}

// --- Export Options ---

export type ExportDataType = "visible" | "all";

export interface ExportOptions {
  /** Type of data to export */
  dataType: ExportDataType;
  /** Columns to include (by key) */
  columns: string[];
  /** File name (without extension) */
  fileName?: string;
}

// --- Component Props ---

export interface FilterableTableProps<T = Record<string, unknown>> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Loading state */
  loading?: boolean;
  /** Default sort configuration */
  defaultSort?: { column: string; direction: "asc" | "desc" };
  /** Array of column keys to show by default (if not provided, show all) */
  defaultVisibleColumns?: string[];
  /** Function to determine row CSS class based on row data */
  rowClass?: (row: T) => string;
  /** Callback when filtered data changes */
  onFilteredDataChange?: (filteredData: T[]) => void;
  /** Whether to show export button (default: true) */
  showExport?: boolean;
  /** Whether to allow column resizing (default: true) */
  allowResize?: boolean;
  /** Whether to show column selector (default: true) */
  showColumnSelector?: boolean;
  /** Base name for export file (will append timestamp, default: "export") */
  exportFileName?: string;
  /** Whether to truncate cell content with ellipsis (default: true) */
  truncateContent?: boolean;
  /** Maximum number of lines to show when truncateContent is true (default: 2) */
  maxLines?: number;
}

export interface DataTableProps<T = Record<string, unknown>> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Visible columns (by key) */
  visibleColumns: string[];
  /** Column widths (by key) */
  columnWidths: Record<string, string>;
  /** Loading state */
  loading?: boolean;
  /** Current sort state */
  sortState: SortState;
  /** Callback when sort changes */
  onSortChange: (column: string) => void;
  /** Callback when column width changes */
  onColumnResize?: (columnKey: string, width: string) => void;
  /** Function to determine row CSS class */
  rowClass?: (row: T) => string;
  /** Whether columns are resizable */
  allowResize?: boolean;
  /** Whether to truncate cell content with ellipsis (default: true) */
  truncateContent?: boolean;
  /** Maximum number of lines to show when truncateContent is true (default: 2) */
  maxLines?: number;
}

export interface AdvancedFilterProps {
  /** Available columns for filtering */
  columns: { value: string; label: string }[];
  /** Callback when filter changes - receives filtered evaluation function */
  onFilterChange: (evaluator: (row: Record<string, unknown>) => boolean) => void;
  /** Whether to enable auto-apply mode by default */
  defaultAutoApply?: boolean;
  /** Callback when reset is clicked */
  onReset?: () => void;
}

// --- Utilities ---

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11);

export const createDefaultFilter = (): FilterGroup => ({
  id: generateId(),
  type: "group",
  operator: "AND",
  children: [
    {
      id: generateId(),
      type: "condition",
      column: "",
      regex: "",
      caseSensitive: false,
    },
  ],
});

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

