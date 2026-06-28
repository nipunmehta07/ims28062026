"use client";

import { HTMLAttributes, forwardRef, useState, useRef, useEffect, ReactNode, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  group?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value" | "onClick"> {
  options: DropdownOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  disabled?: boolean;
  error?: string;
  size?: "sm" | "md" | "lg";
  portal?: boolean;
  variant?: "default" | "glass";
}

const sizeStyles = {
  sm: "py-2 px-3 text-[11px]",
  md: "py-3 px-4 text-[12px]",
  lg: "py-4 px-5 text-[13px]",
};

const dropdownSizes = {
  sm: "max-h-48",
  md: "max-h-64",
  lg: "max-h-80",
};

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchable = false,
    multiSelect = false,
    disabled = false,
    error,
    size = "md",
    portal = true,
    variant = "default",
    className = "",
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedValues = multiSelect
      ? (Array.isArray(value) ? value : value ? [value] : [])
      : (typeof value === "string" ? value : "");

    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedOptions = filteredOptions.reduce((acc, opt) => {
      const group = opt.group || "";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, DropdownOption[]>);

    const allOptions = Object.values(groupedOptions).flat();

    const handleSelect = (optionValue: string) => {
      if (multiSelect) {
        const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter((v: string) => v !== optionValue)
          : [...currentValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
      }
      setSearchTerm("");
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiSelect && Array.isArray(selectedValues)) {
        onChange?.(selectedValues.filter((v: string) => v !== optionValue));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
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

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, searchable]);

    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        items[focusedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [focusedIndex]);

    const getDisplayValue = () => {
      if (multiSelect && Array.isArray(selectedValues) && selectedValues.length > 0) {
        return (
          <div className="flex flex-wrap gap-1.5">
            {selectedValues.map((val: string) => {
              const opt = options.find(o => o.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                >
                  {opt?.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(val, e)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        );
      }
      if (!multiSelect && typeof selectedValues === "string" && selectedValues) {
        const opt = options.find(o => o.value === selectedValues);
        return <span className="truncate text-gray-900 dark:text-white">{opt?.label}</span>;
      }
      return <span className="text-gray-400">{placeholder}</span>;
    };

    const isGlass = variant === "glass";
    const triggerBg = isGlass ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl" : "bg-white dark:bg-zinc-900";
    const dropdownBg = isGlass ? "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl" : "bg-white dark:bg-zinc-900";

    const dropdownContent = (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        {...props}
      >
        {/* Trigger */}
        <button
          type="button"
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full ${sizeStyles[size]} flex items-center justify-between gap-2
            ${triggerBg} border rounded-xl outline-none transition-all duration-200
            ${isOpen 
              ? "border-emerald-500 ring-4 ring-emerald-500/10" 
              : error
                ? "border-rose-300 focus:border-rose-500"
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex-1 text-left truncate">{getDisplayValue()}</div>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 text-emerald-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={`
              absolute z-[90] w-full mt-2 ${dropdownBg}
              border border-gray-200 dark:border-zinc-700 
              rounded-xl shadow-xl overflow-hidden
              ${dropdownSizes[size]}
              transition-all duration-200 animate-in slide-in-from-top-2 fade-in
            `}
            role="listbox"
            aria-multiselectable={multiSelect}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
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
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div ref={listRef} className="overflow-y-auto custom-scrollbar">
              {allOptions.length === 0 ? (
                <div className="p-4 text-center text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  No options found
                </div>
              ) : (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <div key={group}>
                    {group && (
                      <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 dark:from-zinc-800/50 dark:via-zinc-900 dark:to-zinc-800/50 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] border-b border-gray-50 dark:border-zinc-800">
                        {group}
                      </div>
                    )}
                    {groupOptions.map((option) => {
                      const isSelected = multiSelect
                        ? selectedValues.includes(option.value)
                        : selectedValues === option.value;
                      const isFocused = focusedIndex === allOptions.indexOf(option);

                      return (
                        <div
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled}
                          onClick={() => !option.disabled && handleSelect(option.value)}
                          className={`
                            px-4 py-3 flex items-center justify-between gap-2 cursor-pointer
                            transition-all duration-150
                            ${option.disabled
                              ? "opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "bg-emerald-50/70 dark:bg-emerald-950/30"
                                : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                            }
                            ${isFocused ? "bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-inset ring-emerald-500/20" : ""}
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {option.icon && (
                              <span className={`flex-shrink-0 ${isSelected ? "text-emerald-500" : "text-gray-400"}`}>
                                {option.icon}
                              </span>
                            )}
                            <span className={`text-[12px] font-medium truncate ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
                              {option.label}
                            </span>
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

    if (portal && typeof window !== "undefined") {
      return createPortal(dropdownContent, document.body);
    }

    return dropdownContent;
  }
);

Dropdown.displayName = "Dropdown";