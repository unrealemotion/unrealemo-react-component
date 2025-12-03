import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AdvancedFilter } from "./AdvancedFilter";
import { DataTable } from "./DataTable";
import { Card } from "./ui";
import type { FilterableTableProps, SortState, ExportDataType } from "./types";
import ColumnsIcon from "~icons/mdi/view-column-outline";
import ExportIcon from "~icons/mdi/file-excel-outline";
import CloseIcon from "~icons/mdi/close";
import DownloadIcon from "~icons/mdi/download";
import styles from "./FilterableTable.module.scss";

export function FilterableTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  defaultSort,
  defaultVisibleColumns,
  rowClass,
  onFilteredDataChange,
  showExport = true,
  allowResize = true,
  showColumnSelector = true,
  exportFileName = "export",
}: FilterableTableProps<T>) {
  // Filter state
  const [filterEvaluator, setFilterEvaluator] = useState<(row: T) => boolean>(() => () => true);

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    column: defaultSort?.column || null,
    direction: defaultSort?.direction || null,
  });

  // Column visibility state
  const allColumnKeys = useMemo(() => columns.map((col) => col.key as string), [columns]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns || allColumnKeys);

  // Column widths state
  const getInitialWidths = useCallback((): Record<string, string> => {
    const widths: Record<string, string> = {};
    const totalCols = columns.length;
    const defaultWidth = `${Math.floor(100 / totalCols)}%`;
    columns.forEach((col) => {
      widths[col.key as string] = col.width || defaultWidth;
    });
    return widths;
  }, [columns]);

  const [columnWidths, setColumnWidths] = useState<Record<string, string>>(getInitialWidths);
  const [showColumnSelectorDropdown, setShowColumnSelectorDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<ExportDataType>("visible");

  useEffect(() => {
    if (defaultVisibleColumns) setVisibleColumns(defaultVisibleColumns);
  }, [defaultVisibleColumns]);

  const filterColumns = useMemo(() =>
    columns.map((col) => ({ value: col.key as string, label: col.label })), [columns]);

  const handleFilterChange = useCallback((evaluator: (row: Record<string, unknown>) => boolean) => {
    setFilterEvaluator(() => evaluator as (row: T) => boolean);
  }, []);

  const handleSortChange = useCallback((column: string) => {
    setSortState((current) => {
      if (current.column === column) {
        if (current.direction === "asc") return { column, direction: "desc" };
        if (current.direction === "desc") return { column: null, direction: null };
        return { column, direction: "asc" };
      }
      return { column, direction: "asc" };
    });
  }, []);

  const handleReset = useCallback(() => {
    setSortState({ column: null, direction: null });
  }, []);

  const handleColumnResize = useCallback((columnKey: string, width: string) => {
    setColumnWidths((prev) => ({ ...prev, [columnKey]: width }));
  }, []);

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns((current) => {
      if (current.includes(columnKey)) {
        return current.length > 1 ? current.filter((k) => k !== columnKey) : current;
      }
      return [...current, columnKey];
    });
  }, []);

  const selectAllColumns = useCallback(() => setVisibleColumns(allColumnKeys), [allColumnKeys]);
  const selectNoColumns = useCallback(() => setVisibleColumns(allColumnKeys[0] ? [allColumnKeys[0]] : []), [allColumnKeys]);

  const getRawValue = (row: T, column: string): string | number | boolean | null => {
    const value = row[column as keyof T];
    if (value === null || value === undefined) return "";
    if (typeof value === "number" || typeof value === "boolean") return value;
    return String(value);
  };

  const sortData = useCallback((dataToSort: T[]): T[] => {
    const { column, direction } = sortState;
    if (!column || !direction) return dataToSort;

    return [...dataToSort].sort((a, b) => {
      const aVal = getRawValue(a, column);
      const bVal = getRawValue(b, column);
      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
      } else {
        comparison = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
      }
      return direction === "asc" ? comparison : -comparison;
    });
  }, [sortState]);

  const processedData = useMemo(() => {
    const filtered = data.filter(filterEvaluator);
    const sorted = sortData(filtered);
    onFilteredDataChange?.(sorted);
    return sorted;
  }, [data, filterEvaluator, sortData, onFilteredDataChange]);

  const handleExport = useCallback(() => {
    const dataToExport = exportType === "visible" ? processedData : data;
    const columnsToExport = columns.filter((col) => visibleColumns.includes(col.key as string));
    const headers = columnsToExport.map((col) => col.label);
    const rows = dataToExport.map((row) =>
      columnsToExport.map((col) => {
        const value = row[col.key as keyof T];
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
    );
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
    link.download = `${exportFileName}_${ts}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [exportType, processedData, data, columns, visibleColumns, exportFileName]);

  return (
    <div className={styles["filterable-table"]}>
      {data.length > 0 && (
        <>
          <AdvancedFilter columns={filterColumns} onFilterChange={handleFilterChange} onReset={handleReset} defaultAutoApply />
          <div className={styles["toolbar"]}>
            <span className={styles["summary"]}>
              Showing <strong>{processedData.length}</strong> of <strong>{data.length}</strong> items
            </span>
            <div className={styles["toolbar-actions"]}>
              {showColumnSelector && (
                <div className={styles["column-selector"]}>
                  <button className={styles["column-btn"]} onClick={() => setShowColumnSelectorDropdown(!showColumnSelectorDropdown)}>
                    <ColumnsIcon /> Columns ({visibleColumns.length}/{allColumnKeys.length})
                  </button>
                  {showColumnSelectorDropdown && (
                    <div className={styles["column-dropdown"]}>
                      {columns.map((col) => (
                        <label key={col.key as string} className={styles["column-item"]}>
                          <input type="checkbox" checked={visibleColumns.includes(col.key as string)} onChange={() => toggleColumn(col.key as string)} />
                          <span>{col.label}</span>
                        </label>
                      ))}
                      <div className={styles["column-actions"]}>
                        <button className={styles["select-all"]} onClick={selectAllColumns}>All</button>
                        <button className={styles["select-none"]} onClick={selectNoColumns}>Reset</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {showExport && (
                <button className={styles["export-btn"]} onClick={() => setShowExportModal(true)}>
                  <ExportIcon /> Export
                </button>
              )}
            </div>
          </div>
          <Card className="shadow-sm border-0">
            <DataTable
              data={processedData}
              columns={columns}
              visibleColumns={visibleColumns}
              columnWidths={columnWidths}
              loading={loading}
              sortState={sortState}
              onSortChange={handleSortChange}
              onColumnResize={handleColumnResize}
              rowClass={rowClass}
              allowResize={allowResize}
            />
          </Card>
        </>
      )}
      {showExportModal && createPortal(
        <div className={styles["modal-backdrop"]} onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}>
          <div className={styles["export-modal"]}>
            <div className={styles["modal-header"]}>
              <h3><ExportIcon /> Export Data</h3>
              <button className={styles["modal-close"]} onClick={() => setShowExportModal(false)}><CloseIcon /></button>
            </div>
            <div className={styles["modal-body"]}>
              <label className={`${styles["export-option"]} ${exportType === "visible" ? styles["selected"] : ""}`}>
                <input type="radio" name="exportType" checked={exportType === "visible"} onChange={() => setExportType("visible")} />
                <div className={styles["option-content"]}>
                  <div className={styles["option-title"]}>Visible Data ({processedData.length} rows)</div>
                  <div className={styles["option-desc"]}>Export only the filtered and visible data</div>
                </div>
              </label>
              <label className={`${styles["export-option"]} ${exportType === "all" ? styles["selected"] : ""}`}>
                <input type="radio" name="exportType" checked={exportType === "all"} onChange={() => setExportType("all")} />
                <div className={styles["option-content"]}>
                  <div className={styles["option-title"]}>All Data ({data.length} rows)</div>
                  <div className={styles["option-desc"]}>Export all data without filters applied</div>
                </div>
              </label>
            </div>
            <div className={styles["modal-footer"]}>
              <button className={styles["cancel-btn"]} onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className={styles["confirm-btn"]} onClick={handleExport}><DownloadIcon /> Download CSV</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default FilterableTable;

