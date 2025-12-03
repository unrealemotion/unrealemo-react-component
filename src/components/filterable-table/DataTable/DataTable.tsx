import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import SortAscIcon from "~icons/mdi/sort-ascending";
import SortDescIcon from "~icons/mdi/sort-descending";
import SortIcon from "~icons/mdi/sort";
import type { DataTableProps, ColumnDefinition } from "../types";
import styles from "./DataTable.module.scss";

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  visibleColumns,
  columnWidths,
  loading: _loading,
  sortState,
  onSortChange,
  onColumnResize,
  rowClass,
  allowResize = true,
}: DataTableProps<T>) {
  const resizeDataRef = useRef({ column: "", startX: 0, startWidth: 0 });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  const visibleCols = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.key as string)),
    [columns, visibleColumns]
  );

  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return <SortIcon className={styles["sort-icon-inactive"]} />;
    }
    if (sortState.direction === "asc") {
      return <SortDescIcon className={styles["sort-icon-active"]} />;
    }
    if (sortState.direction === "desc") {
      return <SortAscIcon className={styles["sort-icon-active"]} />;
    }
    return <SortIcon className={styles["sort-icon-inactive"]} />;
  };

  const handleHeaderClick = (col: ColumnDefinition<T>, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains(styles["resizer"])) return;
    if (col.sortable !== false) {
      onSortChange(col.key as string);
    }
  };

  const getCellValue = (row: T, col: ColumnDefinition<T>, index: number) => {
    const value = row[col.key as keyof T];
    if (col.render) return col.render(value, row, index);
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const getHeaderClass = (col: ColumnDefinition<T>) => {
    return [
      styles["table-header"],
      col.sortable !== false && styles["sortable-header"],
      col.className,
      resizingColumn === col.key && styles["resizing"],
    ].filter(Boolean).join(" ");
  };

  const getHeaderStyle = (col: ColumnDefinition<T>): React.CSSProperties => {
    const width = columnWidths[col.key as string] || col.width;
    return {
      width,
      textAlign: col.align,
      minWidth: col.minWidth,
    };
  };

  const getCellStyle = (col: ColumnDefinition<T>): React.CSSProperties => ({
    textAlign: col.align,
  });

  const handleResizeMove = useCallback((e: MouseEvent) => {
    const { column, startX, startWidth } = resizeDataRef.current;
    if (!column) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    onColumnResize?.(column, `${newWidth}px`);
  }, [onColumnResize]);

  const handleResizeEnd = useCallback(() => {
    resizeDataRef.current.column = "";
    setResizingColumn(null);
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = (col: ColumnDefinition<T>, e: React.MouseEvent) => {
    if (!allowResize || col.resizable === false) return;
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).parentElement;
    if (!th) return;

    resizeDataRef.current = {
      column: col.key as string,
      startX: e.clientX,
      startWidth: th.offsetWidth,
    };
    setResizingColumn(col.key as string);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  const isResizable = (col: ColumnDefinition<T>) =>
    allowResize && col.resizable !== false;

  return (
    <div className={styles["table-container"]}>
      <table className={styles["data-table"]}>
        <thead>
          <tr>
            {visibleCols.map((col) => (
              <th
                key={col.key as string}
                className={getHeaderClass(col)}
                style={getHeaderStyle(col)}
                onClick={(e) => handleHeaderClick(col, e)}
              >
                <div className={styles["header-content"]}>
                  <span>{col.label}</span>
                  {col.sortable !== false && getSortIcon(col.key as string)}
                </div>
                {isResizable(col) && (
                  <div
                    className={styles["resizer"]}
                    onMouseDown={(e) => handleResizeStart(col, e)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className={rowClass?.(row) || ""}>
                {visibleCols.map((col) => (
                  <td key={col.key as string} className={col.className || ""} style={getCellStyle(col)}>
                    {getCellValue(row, col, index)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={visibleCols.length} className={styles["empty-row"]}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

