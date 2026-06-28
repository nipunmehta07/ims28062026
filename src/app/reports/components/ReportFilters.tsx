"use client";

import { useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Card, Button, Badge } from "@/app/components/ui";
import { DatePicker } from "@/app/components/ui/DatePicker";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { DateRange } from "@/app/components/ui/DatePicker";

export interface ReportFilterDefinition {
  key: string;
  label: string;
  type: "select" | "multiselect" | "text" | "number";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ReportFiltersProps {
  filters: ReportFilterDefinition[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onApply?: (values: Record<string, unknown>) => void;
  showDateRange?: boolean;
  className?: string;
}

type DatePreset = "today" | "week" | "month" | "quarter" | "year" | "custom";

interface FilterValues {
  [key: string]: unknown;
}

export function ReportFilters({
  filters,
  dateRange,
  onDateRangeChange,
  onApply,
  showDateRange = true,
  className = "",
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>(
    dateRange || { from: new Date(), to: new Date() }
  );

  const [values, setValues] = useState<FilterValues>(() => {
    const initial: FilterValues = {};
    filters.forEach((filter) => {
      const param = searchParams.get(filter.key);
      if (param) {
        if (filter.type === "number") initial[filter.key] = Number(param);
        else if (filter.type === "multiselect") initial[filter.key] = param.split(",");
        else initial[filter.key] = param;
      }
    });
    return initial;
  });

  const applyDatePreset = useCallback((preset: DatePreset) => {
    setSelectedPreset(preset);
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined = today;

    switch (preset) {
      case "today":
        from = today;
        to = today;
        break;
      case "week":
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        break;
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1);
        to = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "year":
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31);
        break;
      case "custom":
        return;
    }

    const range = { from, to };
    setCustomDateRange(range);
    onDateRangeChange?.(range);
  }, [onDateRangeChange]);

  const handleCustomDateChange = useCallback((range: Date | DateRange) => {
    if ("from" in range) {
      setCustomDateRange(range);
      setSelectedPreset("custom");
      onDateRangeChange?.(range);
    }
  }, [onDateRangeChange]);

  const handleValueChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    const params = new URLSearchParams();

    if (customDateRange.from) {
      params.set("dateFrom", customDateRange.from.toISOString());
    }
    if (customDateRange.to) {
      params.set("dateTo", customDateRange.to.toISOString());
    }

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (!Array.isArray(value)) {
          params.set(key, String(value));
        }
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    onApply?.(values);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setValues({});
    setCustomDateRange({ from: undefined, to: undefined });
    setSelectedPreset("month");
    router.push(pathname, { scroll: false });
    onApply?.({});
  };

  const handleClearFilter = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    setValues(newValues);
  };

  const activeFilterCount = Object.entries(values).filter(([, v]) =>
    v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
  ).length;

  const presets: { value: DatePreset; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Card variant="glass" padding="lg" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <Badge variant="gradient" size="sm">
              {activeFilterCount} active
            </Badge>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[10px] font-black text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 uppercase tracking-widest transition-colors"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>

      {/* Date Range Section - Emerald badges */}
      {showDateRange && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Date Range
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => applyDatePreset(preset.value)}
                className={`
                  px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                  transition-all border
                  ${selectedPreset === preset.value
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/20"
                    : "bg-white text-gray-500 border-gray-200 hover:border-emerald-500/30 hover:text-emerald-600 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-400 dark:hover:text-emerald-400"
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedPreset === "custom" && (
            <div className="mt-4 max-w-sm">
              <DatePicker
                mode="range"
                value={customDateRange}
                onChange={handleCustomDateChange}
                placeholder="Select date range..."
              />
            </div>
          )}
        </div>
      )}

      {/* Expandable content */}
      {isExpanded && (
        <>
          {/* Additional Filters */}
          {filters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {filters.map((filter) => {
                const value = values[filter.key];

                if (filter.type === "select") {
                  return (
                    <div key={filter.key}>
                      <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                        {filter.label}
                      </label>
                      <select
                        value={String(value ?? "")}
                        onChange={(e) => handleValueChange(filter.key, e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-emerald-500/20 dark:border-emerald-500/30 dark:bg-zinc-900 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                      >
                        <option value="">{filter.placeholder || "All"}</option>
                        {filter.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (filter.type === "multiselect") {
                  const selectedValues = Array.isArray(value) ? value : [];
                  return (
                    <div key={filter.key}>
                      <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                        {filter.label}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {filter.options?.map((opt) => {
                          const isSelected = selectedValues.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const newValues = isSelected
                                  ? selectedValues.filter((v: string) => v !== opt.value)
                                  : [...selectedValues, opt.value];
                                handleValueChange(filter.key, newValues);
                              }}
                              className={`
                                px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                                transition-all border
                                ${isSelected
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/20"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-emerald-500/30 hover:text-emerald-600 dark:bg-zinc-900 dark:border-zinc-700"
                                }
                              `}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-emerald-500/10">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                  <RotateCcw size={14} />
                  Clear all
                </Button>
              )}
            </div>
            <Button variant="gradient" size="sm" onClick={handleApply}>
              Apply filters
            </Button>
          </div>
        </>
      )}

      {/* Active filter badges (collapsed state) */}
      {!isExpanded && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const value = values[filter.key];
            if (value === undefined || value === null || value === "" ||
                (Array.isArray(value) && value.length === 0)) {
              return null;
            }

            const displayValue = Array.isArray(value)
              ? value.map((v) => filter.options?.find((o) => o.value === v)?.label || v).join(", ")
              : filter.options?.find((o) => o.value === value)?.label || String(value);

            return (
              <Badge key={filter.key} variant="gradient" size="sm">
                <span className="font-normal text-emerald-200">{filter.label}:</span> {displayValue}
                <button
                  onClick={() => handleClearFilter(filter.key)}
                  className="ml-1 hover:text-rose-200"
                >
                  x
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default ReportFilters;