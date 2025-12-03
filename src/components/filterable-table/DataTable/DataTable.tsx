import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import SortAscIcon from "~icons/mdi/sort-ascending";
import SortDescIcon from "~icons/mdi/sort-descending";
import SortIcon from "~icons/mdi/sort";
import type { DataTableProps, ColumnDefinition } from "../types";
import styles from "./DataTable.module.scss";

interface ResizeData {
  leftColumn: string;
  rightColumn: string;
  startX: number;
  leftStartWidth: number;
  rightStartWidth: number;
  minWidth: number;
}

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
  const resizeDataRef = useRef<ResizeData | null>(null);
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
    const resizeData = resizeDataRef.current;
    if (!resizeData) return;

    const { leftColumn, rightColumn, startX, leftStartWidth, rightStartWidth, minWidth } = resizeData;
    const diff = e.clientX - startX;

    // Only update if there's actual movement
    if (diff === 0) return;

    // Calculate new widths - left column grows/shrinks, right column does opposite
    const totalWidth = leftStartWidth + rightStartWidth;
    let newLeftWidth = leftStartWidth + diff;
    let newRightWidth = rightStartWidth - diff;

    // Enforce minimum widths
    if (newLeftWidth < minWidth) {
      newLeftWidth = minWidth;
      newRightWidth = totalWidth - minWidth;
    }
    if (newRightWidth < minWidth) {
      newRightWidth = minWidth;
      newLeftWidth = totalWidth - minWidth;
    }

    // Update both columns
    onColumnResize?.(leftColumn, `${newLeftWidth}px`);
    onColumnResize?.(rightColumn, `${newRightWidth}px`);
  }, [onColumnResize]);

  const handleResizeEnd = useCallback(() => {
    resizeDataRef.current = null;
    setResizingColumn(null);
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = (colIndex: number, e: React.MouseEvent) => {
    const leftCol = visibleCols[colIndex];
    const rightCol = visibleCols[colIndex + 1];

    if (!allowResize || !leftCol || !rightCol) return;
    if (leftCol.resizable === false || rightCol.resizable === false) return;

    e.preventDefault();
    e.stopPropagation();

    const th = (e.target as HTMLElement).parentElement;
    const nextTh = th?.nextElementSibling as HTMLElement;
    if (!th || !nextTh) return;

    const minWidth = 50;

    // Lock ALL column widths to their current rendered size before resizing
    // This prevents other columns from shifting when we resize
    const headerRow = th.parentElement;
    if (headerRow) {
      const allThs = headerRow.querySelectorAll('th');
      allThs.forEach((headerTh, idx) => {
        if (idx < visibleCols.length) {
          const col = visibleCols[idx];
          onColumnResize?.(col.key as string, `${headerTh.offsetWidth}px`);
        }
      });
    }

    resizeDataRef.current = {
      leftColumn: leftCol.key as string,
      rightColumn: rightCol.key as string,
      startX: e.clientX,
      leftStartWidth: th.offsetWidth,
      rightStartWidth: nextTh.offsetWidth,
      minWidth,
    };

    setResizingColumn(leftCol.key as string);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  // Check if resizer should show between this column and the next
  const canShowResizer = (colIndex: number) => {
    if (!allowResize) return false;
    const leftCol = visibleCols[colIndex];
    const rightCol = visibleCols[colIndex + 1];
    if (!rightCol) return false; // No resizer on the last column
    return leftCol.resizable !== false && rightCol.resizable !== false;
  };

  return (
    <div className={styles["table-container"]}>
      <table className={styles["data-table"]}>
        <thead>
          <tr>
            {visibleCols.map((col, colIndex) => (
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
                {canShowResizer(colIndex) && (
                  <div
                    className={styles["resizer"]}
                    onMouseDown={(e) => handleResizeStart(colIndex, e)}
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

