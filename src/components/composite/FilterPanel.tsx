"use client";

import { forwardRef, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, Button, Badge } from "@/components/ui";
import { FormField } from "./FormField";
import { ChevronDown, ChevronUp, X, RotateCcw, Link2 } from "lucide-react";

export interface FilterDefinition {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect" | "date" | "daterange" | "number" | "boolean";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
}

export interface FilterPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  filters: FilterDefinition[];
  onChange?: (values: Record<string, unknown>) => void;
  onApply?: (values: Record<string, unknown>) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  urlSync?: boolean;
  showClearAll?: boolean;
  showActiveCount?: boolean;
}

interface FilterValues {
  [key: string]: unknown;
}

export const FilterPanel = forwardRef<HTMLDivElement, FilterPanelProps>(
  ({
    filters,
    onChange,
    onApply,
    collapsible = true,
    defaultExpanded = false,
    urlSync = false,
    showClearAll = true,
    showActiveCount = true,
    className = "",
    ...props
  }, ref) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [animating, setAnimating] = useState(false);
    const [values, setValues] = useState<FilterValues>(() => {
      const initial: FilterValues = {};
      filters.forEach((filter) => {
        if (filter.defaultValue !== undefined) {
          initial[filter.key] = filter.defaultValue;
        }
      });
      return initial;
    });


    const getValueFromUrl = useCallback((key: string): unknown => {
      if (!urlSync) return undefined;
      const param = searchParams.get(key);
      if (!param) return undefined;
      
      const filter = filters.find((f) => f.key === key);
      if (!filter) return param;
      
      switch (filter.type) {
        case "number":
          return Number(param);
        case "boolean":
          return param === "true";
        case "multiselect":
          return param.split(",");
        default:
          return param;
      }
    }, [filters, searchParams, urlSync]);

    const syncValuesToUrl = useCallback((newValues: FilterValues) => {
      if (!urlSync) return;
      
      const params = new URLSearchParams();
      Object.entries(newValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && 
            !(Array.isArray(value) && value.length === 0)) {
          params.set(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    }, [pathname, router, urlSync]);

    useEffect(() => {
      if (urlSync && searchParams) {
        const urlValues: FilterValues = {};
        filters.forEach((filter) => {
          const value = getValueFromUrl(filter.key);
          if (value !== undefined) {
            urlValues[filter.key] = value;
          }
        });
        if (Object.keys(urlValues).length > 0) {
          setValues((prev) => ({ ...prev, ...urlValues }));
          onChange?.(urlValues);
        }
      }
    }, [urlSync, searchParams, filters, getValueFromUrl, onChange]);

    const activeFilterCount = Object.entries(values).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;

    const handleValueChange = (key: string, value: unknown) => {
      const newValues = { ...values, [key]: value };
      setValues(newValues);
      onChange?.(newValues);
    };

    const handleApply = () => {
      syncValuesToUrl(values);
      onApply?.(values);
    };

    const handleClear = () => {
      const clearedValues: FilterValues = {};
      filters.forEach((filter) => {
        clearedValues[filter.key] = filter.defaultValue;
      });
      setValues(clearedValues);
      syncValuesToUrl({});
      onChange?.(clearedValues);
      onApply?.(clearedValues);
    };

    const handleClearFilter = (key: string) => {
      const filter = filters.find((f) => f.key === key);
      const newValues = { ...values, [key]: filter?.defaultValue };
      setValues(newValues);
      onChange?.(newValues);
    };

    const handleToggleExpand = () => {
      setAnimating(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => setAnimating(false), 300);
    };

    const renderFilter = (filter: FilterDefinition) => {
      const value = values[filter.key];
      const hasActiveValue = value !== undefined && value !== null && value !== "" &&
        !(Array.isArray(value) && value.length === 0);
      
      switch (filter.type) {
        case "select":
          return (
            <FormField key={filter.key} label={filter.label}>
              <select
                value={String(value ?? "")}
                onChange={(e) => handleValueChange(filter.key, e.target.value)}
                className={`
                  w-full px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm 
                  border rounded-xl text-[12px] font-bold outline-none transition-all duration-200
                  ${hasActiveValue 
                    ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" 
                    : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
                  }
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                  hover:border-emerald-300 dark:hover:border-emerald-600
                `}
              >
                <option value="">{filter.placeholder || "All"}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          );
        
        case "multiselect":
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <FormField key={filter.key} label={filter.label}>
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
                        transition-all duration-200 border
                        ${isSelected
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25"
                          : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-gray-500 border-gray-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-600"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          );
        
        case "number":
          return (
            <FormField key={filter.key} label={filter.label} helperText={filter.placeholder}>
              <input
                type="number"
                value={String(value ?? "")}
                onChange={(e) => handleValueChange(filter.key, e.target.value ? Number(e.target.value) : undefined)}
                className={`
                  w-full px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm 
                  border rounded-xl text-[12px] font-bold outline-none transition-all duration-200
                  ${hasActiveValue 
                    ? "border-emerald-300 dark:border-emerald-700" 
                    : "border-gray-200 dark:border-zinc-700"
                  }
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                  hover:border-emerald-300 dark:hover:border-emerald-600
                  dark:text-white
                `}
                placeholder={filter.placeholder}
              />
            </FormField>
          );
        
        case "boolean":
          return (
            <FormField key={filter.key} label={filter.label}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => handleValueChange(filter.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500 transition-all duration-200" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 peer-checked:translate-x-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {filter.placeholder || "Enable"}
                </span>
              </label>
            </FormField>
          );
        
        case "text":
        default:
          return (
            <FormField key={filter.key} label={filter.label}>
              <input
                type="text"
                value={String(value ?? "")}
                onChange={(e) => handleValueChange(filter.key, e.target.value)}
                className={`
                  w-full px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm 
                  border rounded-xl text-[12px] font-bold outline-none transition-all duration-200
                  ${hasActiveValue 
                    ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" 
                    : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
                  }
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                  hover:border-emerald-300 dark:hover:border-emerald-600
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                `}
                placeholder={filter.placeholder}
              />
            </FormField>
          );
      }
    };

    const content = (
      <div className="flex flex-col gap-6">
        {/* Filter fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filters.map(renderFilter)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-3">
            {/* URL Sync indicator */}
            {urlSync && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                <Link2 size={10} />
                URL Sync
              </div>
            )}
            {showClearAll && activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50">
                <RotateCcw size={14} />
                Clear all
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button variant="ghost" size="sm" onClick={handleToggleExpand}>
                <ChevronUp size={14} />
                Collapse
              </Button>
            )}
            <Button variant="gradient" size="sm" onClick={handleApply} className="shadow-lg shadow-emerald-500/20">
              Apply filters
            </Button>
          </div>
        </div>
      </div>
    );

    const panelContent = (
      <Card variant="outlined" padding="lg" className={`overflow-hidden ${className}`} {...props}>
        {/* Header with emerald accent */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Filters
            </h3>
            {showActiveCount && activeFilterCount > 0 && (
              <Badge variant="gradient" size="sm" className="animate-[fadeIn_0.2s_ease-out]">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          
          {collapsible && (
            <button
              onClick={handleToggleExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Show
                </>
              )}
            </button>
          )}
        </div>

        {/* Expandable content with smooth animation */}
        <div className={`
          transition-all duration-300 ease-out
          ${collapsible ? (isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden') : ''}
          ${animating ? 'overflow-hidden' : ''}
        `}>
          {content}
        </div>

        {/* Active filter badges (collapsed state) */}
        {collapsible && !isExpanded && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 animate-[fadeIn_0.2s_ease-out]">
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
                <Badge key={filter.key} variant="success" size="sm" className="pr-1.5">
                  <span className="font-normal text-emerald-600 dark:text-emerald-300">{filter.label}:</span> 
                  <span className="ml-1 mr-1">{displayValue}</span>
                  <button
                    onClick={() => handleClearFilter(filter.key)}
                    className="ml-1 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </Card>
    );

    return (
      <div ref={ref} className="relative">
        {/* Background glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10 rounded-2xl blur-xl opacity-50" />
        <div className="relative">
          {panelContent}
        </div>
      </div>
    );
  }
);

FilterPanel.displayName = "FilterPanel";

export default FilterPanel;