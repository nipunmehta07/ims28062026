"use client";

import { forwardRef, ReactNode, useState } from "react";
import { Drawer, Tabs, Button } from "@/app/components/ui";
import { Save, Trash2 } from "lucide-react";

export interface DetailDrawerTab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DetailDrawerAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gradient";
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface DetailDrawerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  tabs?: DetailDrawerTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: ReactNode;
  footerActions?: DetailDrawerAction[];
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  closable?: boolean;
  onSave?: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  deleteLabel?: string;
  isLoading?: boolean;
}

export const DetailDrawer = forwardRef<HTMLDivElement, DetailDrawerProps>(
  ({
    isOpen,
    onClose,
    title,
    subtitle,
    tabs,
    defaultTab,
    activeTab: controlledActiveTab,
    onTabChange,
    children,
    footerActions = [],
    showCloseButton = true,
    size = "md",
    closable = true,
    onSave,
    onDelete,
    saveLabel = "Save",
    deleteLabel = "Delete",
    isLoading = false,
    className = "",
    ...props
  }, ref) => {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs?.[0]?.id);
    
    const isControlled = controlledActiveTab !== undefined;
    const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

    const handleTabChange = (tabId: string) => {
      if (!isControlled) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
    };

    const handleClose = () => {
      if (closable) {
        onClose();
      }
    };

    const renderFooter = () => {
      const defaultActions: DetailDrawerAction[] = [];
      
      if (onSave) {
        defaultActions.push({
          label: saveLabel,
          icon: <Save size={14} />,
          variant: "gradient",
          onClick: onSave,
          isLoading,
        });
      }
      
      if (onDelete) {
        defaultActions.push({
          label: deleteLabel,
          icon: <Trash2 size={14} />,
          variant: "danger",
          onClick: onDelete,
        });
      }

      const allActions = [...defaultActions, ...footerActions];

      if (allActions.length === 0) return null;

      return (
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center gap-2">
            {allActions.slice(0, 1).map((action, i) => (
              <Button
                key={i}
                variant={action.variant || "secondary"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                isLoading={action.isLoading}
                className={action.variant === "gradient" ? "shadow-lg shadow-emerald-500/20" : ""}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {allActions.slice(1).map((action, i) => (
              <Button
                key={i}
                variant={action.variant || "secondary"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                isLoading={action.isLoading}
                className={action.variant === "gradient" ? "shadow-lg shadow-emerald-500/20" : ""}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      );
    };

    const renderContent = () => {
      if (tabs && tabs.length > 0) {
        const tabObjects = tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          disabled: tab.disabled,
          content: tab.content,
        }));

        return (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <Tabs
              tabs={tabObjects}
              activeTab={activeTab}
              onChange={handleTabChange}
              variant="gradient"
            />
          </div>
        );
      }

      return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          {children}
        </div>
      );
    };

    return (
      <Drawer
        ref={ref}
        isOpen={isOpen}
        onClose={handleClose}
        title={title}
        size={size}
        showCloseButton={showCloseButton}
        variant="glass"
        className={className}
        {...props}
      >
        {/* Glassmorphism Header */}
        {title && (
          <div className="relative mb-6 pb-6 border-b border-emerald-200/30 dark:border-emerald-800/30">
            {/* Background gradient accent */}
            <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 rounded-lg" />
            
            <div className="relative flex items-start justify-between">
              <div>
                {/* Emerald accent bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
                    Details
                  </span>
                </div>
                
                {/* Gradient Title */}
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text">
                  {title}
                </h2>
              </div>
              
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 active:scale-95 shadow-lg shadow-gray-500/10"
                  aria-label="Close drawer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subtitle with emerald accent */}
        {subtitle && (
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mb-6 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {subtitle}
          </p>
        )}

        {/* Tab gradient indicator */}
        {tabs && tabs.length > 0 && (
          <div className="relative mb-6 -mx-8 px-8">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          </div>
        )}

        {/* Main content with fade-in animation */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {renderContent()}
        </div>

        {/* Footer with emerald primary action */}
        {renderFooter()}
      </Drawer>
    );
  }
);

DetailDrawer.displayName = "DetailDrawer";

export default DetailDrawer;