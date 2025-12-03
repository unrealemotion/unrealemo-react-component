import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "../ui";
import PlusIcon from "~icons/mdi/plus";
import DeleteIcon from "~icons/mdi/delete";
import FolderPlusIcon from "~icons/mdi/folder-plus";
import RefreshIcon from "~icons/mdi/refresh";
import type {
  AdvancedFilterProps,
  FilterGroup,
  FilterCondition,
  FilterNode,
} from "../types";
import { generateId, createDefaultFilter, deepClone } from "../types";
import styles from "./AdvancedFilter.module.scss";

// Mutable filter values store
const filterValuesStore = new Map<string, { column: string; regex: string; caseSensitive: boolean }>();

const getFilterValue = (id: string, defColumn: string, defRegex: string, defCaseSensitive = false) => {
  if (!filterValuesStore.has(id)) {
    filterValuesStore.set(id, { column: defColumn, regex: defRegex, caseSensitive: defCaseSensitive });
  }
  return filterValuesStore.get(id)!;
};

const setFilterValue = (id: string, column: string, regex: string, caseSensitive: boolean) => {
  filterValuesStore.set(id, { column, regex, caseSensitive });
};

const buildFilterWithValues = (node: FilterNode): FilterNode => {
  if (node.type === "condition") {
    const values = getFilterValue(node.id, node.column, node.regex, node.caseSensitive ?? false);
    return { ...node, column: values.column, regex: values.regex, caseSensitive: values.caseSensitive };
  }
  return { ...node, children: node.children.map(buildFilterWithValues) };
};

// --- Filter Condition Item ---
interface FilterConditionItemProps {
  condition: FilterCondition;
  columns: { value: string; label: string }[];
  onRemove: () => void;
  onValueChange: () => void;
  onEnterKey: () => void;
}

function FilterConditionItem({ condition, columns, onRemove, onValueChange, onEnterKey }: FilterConditionItemProps) {
  const initVals = getFilterValue(condition.id, condition.column || columns[0]?.value || "", condition.regex, condition.caseSensitive ?? false);
  const [localColumn, setLocalColumn] = useState(initVals.column);
  const [localRegex, setLocalRegex] = useState(initVals.regex);
  const [localCaseSensitive, setLocalCaseSensitive] = useState(initVals.caseSensitive);

  const handleColumnChange = (value: string) => {
    setLocalColumn(value);
    setFilterValue(condition.id, value, localRegex, localCaseSensitive);
    onValueChange();
  };

  const handleRegexInput = (value: string) => {
    setLocalRegex(value);
    setFilterValue(condition.id, localColumn, value, localCaseSensitive);
    onValueChange();
  };

  const handleCaseSensitiveChange = (checked: boolean) => {
    setLocalCaseSensitive(checked);
    setFilterValue(condition.id, localColumn, localRegex, checked);
    onValueChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnterKey();
    }
  };

  return (
    <div className={styles["filter-item"]}>
      <select
        className={styles["column-select"]}
        value={localColumn}
        onChange={(e) => handleColumnChange(e.target.value)}
      >
        {columns.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <input
        type="text"
        className={styles["regex-input"]}
        placeholder="Regex..."
        value={localRegex}
        onChange={(e) => handleRegexInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <label className={styles["case-sensitive-label"]} title="Case sensitive">
        <input
          type="checkbox"
          checked={localCaseSensitive}
          onChange={(e) => handleCaseSensitiveChange(e.target.checked)}
        />
        <span>Aa</span>
      </label>
      <Button color="danger" variant="outline" size="sm" onClick={onRemove} className={styles["action-btn"]} title="Remove condition">
        <DeleteIcon />
      </Button>
    </div>
  );
}

// --- Filter Group Builder ---
interface FilterGroupBuilderProps {
  group: FilterGroup;
  columns: { value: string; label: string }[];
  onStructureChange: (updated: FilterGroup) => void;
  onValueChange: () => void;
  onEnterKey: () => void;
  onRemove: () => void;
  isRoot?: boolean;
}

function FilterGroupBuilder({ group, columns, onStructureChange, onValueChange, onEnterKey, onRemove, isRoot }: FilterGroupBuilderProps) {
  const handleToggleOperator = () => {
    const updated = deepClone(group);
    updated.operator = updated.operator === "AND" ? "OR" : "AND";
    onStructureChange(updated);
  };

  const handleAddCondition = () => {
    const newId = generateId();
    const defaultColumn = columns[0]?.value || "";
    setFilterValue(newId, defaultColumn, "", false);
    const updated = deepClone(group);
    updated.children.push({ id: newId, type: "condition", column: defaultColumn, regex: "", caseSensitive: false });
    onStructureChange(updated);
  };

  const handleAddGroup = () => {
    const newConditionId = generateId();
    const defaultColumn = columns[0]?.value || "";
    setFilterValue(newConditionId, defaultColumn, "", false);
    const updated = deepClone(group);
    updated.children.push({
      id: generateId(), type: "group", operator: "AND",
      children: [{ id: newConditionId, type: "condition", column: defaultColumn, regex: "", caseSensitive: false }],
    });
    onStructureChange(updated);
  };

  const handleRemoveChild = (index: number) => {
    const child = group.children[index];
    const removeFromStore = (node: FilterNode) => {
      if (node.type === "condition") filterValuesStore.delete(node.id);
      else node.children.forEach(removeFromStore);
    };
    removeFromStore(child);
    const updated = deepClone(group);
    updated.children.splice(index, 1);
    onStructureChange(updated);
  };

  const handleChildStructureChange = (index: number, child: FilterNode) => {
    const updated = deepClone(group);
    updated.children[index] = child;
    onStructureChange(updated);
  };

  return (
    <div className={`${styles["filter-group"]} ${isRoot ? styles["root-group"] : ""}`}>
      <div className={styles["group-header"]}>
        <Button color={group.operator === "AND" ? "primary" : "warning"} size="sm" onClick={handleToggleOperator} className={styles["operator-toggle"]}>
          {group.operator}
        </Button>
        <Button color="secondary" variant="outline" size="sm" onClick={handleAddCondition} className={styles["action-btn"]} title="Add Condition">
          <PlusIcon /> Condition
        </Button>
        <Button color="secondary" variant="outline" size="sm" onClick={handleAddGroup} className={styles["action-btn"]} title="Add Group">
          <FolderPlusIcon /> Group
        </Button>
        {!isRoot && (
          <Button color="danger" variant="outline" size="sm" onClick={onRemove} className={styles["action-btn"]} title="Remove Group">
            <DeleteIcon />
          </Button>
        )}
      </div>
      {group.children.map((child, index) =>
        child.type === "group" ? (
          <FilterGroupBuilder
            key={child.id}
            group={child}
            columns={columns}
            onStructureChange={(updated) => handleChildStructureChange(index, updated)}
            onValueChange={onValueChange}
            onEnterKey={onEnterKey}
            onRemove={() => handleRemoveChild(index)}
          />
        ) : (
          <FilterConditionItem
            key={child.id}
            condition={child}
            columns={columns}
            onRemove={() => handleRemoveChild(index)}
            onValueChange={onValueChange}
            onEnterKey={onEnterKey}
          />
        )
      )}
    </div>
  );
}

// --- Main Advanced Filter Component ---
export function AdvancedFilter({ columns, onFilterChange, defaultAutoApply = true, onReset }: AdvancedFilterProps) {
  const [filterRoot, setFilterRoot] = useState<FilterGroup>(createDefaultFilter);
  const [isAutoApply, setIsAutoApply] = useState(defaultAutoApply);
  const debouncedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createEvaluator = useCallback((root: FilterGroup) => {
    const evaluateNode = (node: FilterNode, row: Record<string, unknown>): boolean => {
      if (node.type === "condition") {
        if (!node.regex) return true;
        try {
          const flags = node.caseSensitive ? "" : "i";
          const regex = new RegExp(node.regex, flags);
          const value = row[node.column];
          const strValue = value === null || value === undefined ? "" : String(value);
          return regex.test(strValue);
        } catch {
          return false;
        }
      } else {
        if (node.children.length === 0) return true;
        return node.operator === "AND"
          ? node.children.every((child) => evaluateNode(child, row))
          : node.children.some((child) => evaluateNode(child, row));
      }
    };
    return (row: Record<string, unknown>) => evaluateNode(root, row);
  }, []);

  const applyFilter = useCallback(() => {
    const completeFilter = buildFilterWithValues(filterRoot) as FilterGroup;
    onFilterChange(createEvaluator(completeFilter));
  }, [filterRoot, onFilterChange, createEvaluator]);

  const triggerDebouncedApply = useCallback(() => {
    if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current);
    if (isAutoApply) {
      debouncedTimerRef.current = setTimeout(applyFilter, 500);
    }
  }, [isAutoApply, applyFilter]);

  const handleStructureChange = (updated: FilterGroup) => {
    setFilterRoot(updated);
    triggerDebouncedApply();
  };

  const handleEnterKey = () => {
    if (!isAutoApply) {
      if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current);
      applyFilter();
    }
  };

  const handleReset = () => {
    onFilterChange(() => true);
    onReset?.();
  };

  useEffect(() => {
    return () => { if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current); };
  }, []);

  return (
    <div className={styles["filter-card"]}>
      <div className={styles["filter-header"]}>
        <h6>Filter - Advanced</h6>
        <div className={styles["filter-controls"]}>
          <label className={styles["auto-apply-label"]}>
            <input type="checkbox" checked={isAutoApply} onChange={(e) => setIsAutoApply(e.target.checked)} />
            <span>Auto-apply (500ms)</span>
          </label>
          <Button color="secondary" variant="outline" size="sm" startIcon={<RefreshIcon />} onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
      <div className={styles["filter-tree-container"]}>
        <FilterGroupBuilder
          group={filterRoot}
          columns={columns}
          onStructureChange={handleStructureChange}
          onValueChange={triggerDebouncedApply}
          onEnterKey={handleEnterKey}
          onRemove={() => {}}
          isRoot
        />
      </div>
    </div>
  );
}

export default AdvancedFilter;

