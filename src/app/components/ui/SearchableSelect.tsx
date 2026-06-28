"use client";

import { forwardRef, useState, useRef, useEffect, HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";

// Legacy option interface (used with inventory prop)
export interface LegacySearchableSelectOption {
  id?: string;
  name?: string;
  quantityOnHand?: number;
  unit?: string;
  sku?: string;
  category?: string;
}

// New unified option interface
export interface SearchableSelectOption {
  value: string;
  label: string;
  group?: string;
  meta?: string; // Additional info like quantity
  disabled?: boolean;
}

export interface SearchableSelectProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value"> {
  // Legacy prop for backward compatibility
  inventory?: LegacySearchableSelectOption[];
  // New prop
  options?: SearchableSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: string;
}

const groupLabels: Record<string, string> = {
  "Finished Good": "Finished Goods",
  "": "Options",
};

export const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({
    inventory,
    options,
    value,
    onChange,
    placeholder = "Search...",
    searchPlaceholder = "Search product or SKU...",
    emptyMessage = "No matching items",
    disabled = false,
    error,
    className = "",
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Convert legacy inventory to new options format
    const normalizedOptions: SearchableSelectOption[] = options || 
      (inventory?.map(item => ({
        value: item.id || "",
        label: item.name || "",
        meta: item.quantityOnHand !== undefined ? `${item.quantityOnHand} ${item.unit || ""}` : item.sku,
        group: item.category,
      })) || []);

    // Find selected option
    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.meta && opt.meta.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Group options
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
      const group = opt.group || "";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SearchableSelectOption[]>);

    const allOptions = Object.values(groupedOptions).flat();

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen]);

    // Scroll focused item into view
    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        items[focusedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [focusedIndex]);

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && allOptions[focusedIndex]) {
            handleSelect(allOptions[focusedIndex].value);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    };

    const displayValue = selectedOption
      ? `${selectedOption.label}${selectedOption.meta ? ` (${selectedOption.meta})` : ""}`
      : "";

    const dropdownContent = (
      <div ref={containerRef} className={`relative w-full ${className}`} {...props}>
        {/* Input */}
        <button
          type="button"
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full py-3 px-4 flex items-center gap-3
            bg-white dark:bg-zinc-900 border rounded-xl outline-none transition-all duration-200
            ${error
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : isOpen
                ? "border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-emerald-500"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`flex-1 text-left text-[12px] font-medium truncate ${displayValue ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            {displayValue || (isOpen ? searchTerm : placeholder)}
          </span>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 text-emerald-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="absolute z-[100] w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
            role="listbox"
          >
            {/* Emerald accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            {/* Search input */}
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-zinc-800/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg text-[11px] font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Options */}
            <div ref={listRef} className="overflow-y-auto custom-scrollbar max-h-56">
              {allOptions.length === 0 ? (
                <div className="p-4 text-center text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  {emptyMessage}
                </div>
              ) : (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <div key={group}>
                    {group && (
                      <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 dark:from-zinc-800/50 dark:via-zinc-900 dark:to-zinc-800/50 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] border-b border-gray-50 dark:border-zinc-800">
                        {groupLabels[group] || group}
                      </div>
                    )}
                    {groupOptions.map((option) => {
                      const isSelected = option.value === value;
                      const isFocused = focusedIndex === allOptions.indexOf(option);

                      return (
                        <div
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(option.value)}
                          className={`
                            px-4 py-3 flex items-center justify-between gap-3 cursor-pointer
                            transition-colors duration-150
                            ${isSelected
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30"
                              : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                            }
                            ${isFocused ? "bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-inset ring-emerald-500/20" : ""}
                          `}
                        >
                          <div className="flex-1 min-w-0">
                            <span className={`text-[12px] font-medium block truncate ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
                              {option.label}
                            </span>
                            {option.meta && (
                              <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">
                                {option.meta}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check size={14} className="flex-shrink-0 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-[10px] font-medium text-rose-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );

    if (typeof window === "undefined") return null;
    return createPortal(dropdownContent, document.body);
  }
);

SearchableSelect.displayName = "SearchableSelect";

export default SearchableSelect;