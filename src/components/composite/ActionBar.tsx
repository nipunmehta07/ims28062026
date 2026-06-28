"use client";

import { forwardRef, ReactNode, useState } from "react";
import { Button, Dropdown, Input } from "@/components/ui";
import { Search, Plus, MoreHorizontal } from "lucide-react";

export interface ActionBarPrimaryAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "gradient" | "gradient-dark";
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface ActionBarSecondaryAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "gradient";
  onClick: () => void;
  disabled?: boolean;
}

export interface ActionBarBulkAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "gradient";
  onClick: (selectedCount: number) => void;
}

export interface ActionBarSearch {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  primaryAction?: ActionBarPrimaryAction;
  secondaryActions?: ActionBarSecondaryAction[];
  search?: ActionBarSearch | boolean;
  bulkActions?: ActionBarBulkAction[];
  selectedCount?: number;
  showBulkActions?: boolean;
}

export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  ({
    primaryAction,
    secondaryActions = [],
    search,
    bulkActions = [],
    selectedCount = 0,
    showBulkActions = true,
    className = "",
    ...props
  }, ref) => {
    const [searchFocused, setSearchFocused] = useState(false);
    const hasSearch = search === true || (search && typeof search === "object");
    const searchConfig = search === true 
      ? { placeholder: "Search..." }
      : search || null;

    const hasBulkActions = showBulkActions && selectedCount > 0 && bulkActions.length > 0;

    const secondaryDropdownOptions = secondaryActions
      .filter((action) => !action.variant || action.variant === "ghost")
      .map((action) => ({
        value: action.label,
        label: action.label,
        icon: action.icon,
        disabled: action.disabled,
      }));

    const hasSecondaryDropdown = secondaryDropdownOptions.length > 0;
    const visibleSecondaryActions = secondaryActions.filter(
      (action) => action.variant && action.variant !== "ghost"
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      searchConfig?.onChange?.(e.target.value);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchConfig?.onSearch) {
        searchConfig.onSearch((e.target as HTMLInputElement).value);
      }
    };

    const handleSecondaryDropdownSelect = (value: string | string[]) => {
      const action = secondaryActions.find((a) => a.label === value);
      action?.onClick();
    };

    return (
      <div
        ref={ref}
        className={`relative ${className}`}
        {...props}
      >
        {/* Background with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-white/95 to-teal-50/80 dark:from-emerald-950/40 dark:via-zinc-900/95 dark:to-teal-950/40 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5" />
        
        <div className="relative flex items-center justify-between gap-4 flex-wrap p-4">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1">
            {/* Bulk Actions with danger gradient when active */}
            {hasBulkActions && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-size-200 animate-[gradientShift_3s_ease_infinite] rounded-xl text-white shadow-lg shadow-emerald-500/25">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {selectedCount} selected
                </span>
                <div className="w-px h-4 bg-white/30" />
                {bulkActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => action.onClick(selectedCount)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest 
                      rounded-lg transition-all duration-150
                      ${action.variant === "danger" 
                        ? "bg-rose-500 hover:bg-rose-600 shadow-md" 
                        : "hover:bg-white/20"
                      }
                    `}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search with emerald focus */}
            {hasSearch && searchConfig && (
              <div className="relative w-full max-w-xs group">
                {/* Focus glow */}
                <div className={`
                  absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-0
                  transition-opacity duration-300
                  ${searchFocused ? 'opacity-40' : ''}
                `} />
                
                <div className="relative">
                  <Search
                    size={14}
                    className={`
                      absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                      ${searchFocused ? 'text-emerald-500' : 'text-gray-400'}
                    `}
                  />
                  <Input
                    type="text"
                    value={searchConfig.value}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={searchConfig.placeholder || "Search..."}
                    className="pl-9 pr-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 border-emerald-200/50 dark:border-emerald-800/50 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Visible secondary actions (non-dropdown) */}
            {visibleSecondaryActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || "secondary"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="backdrop-blur-md"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}

            {/* Secondary actions dropdown with glassmorphism */}
            {hasSecondaryDropdown && (
              <Dropdown
                options={secondaryDropdownOptions}
                onChange={handleSecondaryDropdownSelect}
                placeholder="More"
                size="sm"
                portal={false}
              >
                <Button variant="ghost" size="sm" className="backdrop-blur-md">
                  <MoreHorizontal size={14} />
                </Button>
              </Dropdown>
            )}

            {/* Primary action with emerald gradient */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || "gradient"}
                size="sm"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                isLoading={primaryAction.isLoading}
                className="shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {primaryAction.icon || <Plus size={14} />}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ActionBar.displayName = "ActionBar";

export default ActionBar;