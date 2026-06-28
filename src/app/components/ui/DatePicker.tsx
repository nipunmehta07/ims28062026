"use client";

import { HTMLAttributes, forwardRef, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value"> {
  value?: Date | DateRange;
  onChange?: (date: Date | DateRange) => void;
  mode?: "single" | "range";
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showPresets?: boolean;
  locale?: string;
}

interface Preset {
  label: string;
  getValue: () => Date | DateRange;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({
    value,
    onChange,
    mode = "single",
    placeholder,
    disabled = false,
    error,
    showPresets = true,

    className = "",
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (mode === "range" && value && "from" in value && value.from) {
        return value.from;
      }
      if (mode === "single" && value instanceof Date) {
        return value;
      }
      return new Date();
    });
    const [selectingStart, setSelectingStart] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const presets: Preset[] = [
      { label: "Today", getValue: () => new Date() },
      { label: "Tomorrow", getValue: () => addDays(new Date(), 1) },
      { label: "This Week", getValue: () => ({ from: new Date(), to: addDays(new Date(), 7) }) },
      { label: "This Month", getValue: () => ({ from: new Date(), to: endOfMonth(new Date()) }) },
      { label: "This Quarter", getValue: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return { from: new Date(now.getFullYear(), quarter * 3, 1), to: new Date(now.getFullYear(), quarter * 3 + 3, 0) };
      }},
      { label: "This Year", getValue: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date(new Date().getFullYear(), 11, 31) }) },
    ];

    const getValueAsDate = (): Date | undefined => {
      if (mode === "single" && value instanceof Date) return value;
      if (mode === "range" && value && "from" in value) return value.from;
      return undefined;
    };

    const getValueAsRange = (): DateRange => {
      if (mode === "range" && value && "from" in value) return value as DateRange;
      return { from: new Date(), to: undefined };
    };

    const displayValue = mode === "single"
      ? getValueAsDate() ? format(getValueAsDate()!, "MMM d, yyyy") : ""
      : (() => {
          const range = getValueAsRange();
          return range.from
            ? `${format(range.from, "MMM d")}${range.to ? ` - ${format(range.to, "MMM d, yyyy")}` : " - Select end"}`
            : "";
        })();

    const handleDateClick = (date: Date) => {
      if (mode === "single") {
        onChange?.(date);
        setIsOpen(false);
      } else {
        if (selectingStart) {
          onChange?.({ from: date, to: undefined });
          setSelectingStart(false);
        } else {
          const range = getValueAsRange();
          if (date < (range.from || new Date())) {
            onChange?.({ from: date, to: range.from });
          } else {
            onChange?.({ from: range.from, to: date });
          }
          setSelectingStart(true);
          setIsOpen(false);
        }
      }
    };

    const handlePresetClick = (preset: Preset) => {
      onChange?.(preset.getValue());
      setIsOpen(false);
    };

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSelectingStart(true);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const renderCalendar = () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const range = getValueAsRange();
      const today = new Date();

      const days: Date[] = [];
      let day = startDate;
      while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
      }

      const weeks: Date[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
      }

      return (
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400 hover:text-emerald-500"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400 hover:text-emerald-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
              <div 
                key={d} 
                className={`
                  text-[9px] font-bold uppercase text-center py-1
                  ${i === 0 || i === 6 ? "text-rose-400 dark:text-rose-500" : "text-gray-400 dark:text-gray-500"}
                `}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((d, i) => {
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, today);
              const isSelected = mode === "single"
                ? getValueAsDate() && isSameDay(d, getValueAsDate()!)
                : (range.from && isSameDay(d, range.from)) || (range.to && isSameDay(d, range.to));
              const isInRange = mode === "range" && range.from && range.to && isWithinInterval(d, { start: range.from, end: range.to });

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDateClick(d)}
                  className={`
                    w-8 h-8 text-[11px] font-medium rounded-lg transition-all duration-150
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}
                    ${isToday && !isSelected ? "ring-1 ring-emerald-400 dark:ring-emerald-500" : ""}
                    ${isSelected
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                      : isInRange
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-emerald-500"
                    }
                    active:scale-95
                  `}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>

          {/* Range indicator */}
          {mode === "range" && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <p className={`
                text-[9px] font-bold uppercase tracking-widest text-center
                ${selectingStart ? "text-emerald-500" : "text-teal-500"}
              `}>
                {selectingStart ? "Select start date" : "Select end date"}
              </p>
            </div>
          )}
        </div>
      );
    };

    const dropdownContent = (
      <div ref={containerRef} className={`relative ${className}`} {...props}>
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
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
          `}
        >
          <Calendar size={16} className={`${error ? "text-rose-400" : "text-emerald-500"}`} />
          <span className={`text-[12px] font-medium ${displayValue ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            {displayValue || placeholder || "Select date..."}
          </span>
        </button>

        {isOpen && (
          <div 
            className={`
              absolute z-[90] mt-2 bg-white dark:bg-zinc-900 
              border border-gray-200 dark:border-zinc-700 
              rounded-xl shadow-xl overflow-hidden
              animate-in slide-in-from-top-2 fade-in duration-200
            `}
          >
            {/* Emerald accent bar */}
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            {showPresets && mode === "range" && (
              <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-zinc-800/50">
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className="px-3 py-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {renderCalendar()}
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

DatePicker.displayName = "DatePicker";