"use client";

import { HTMLAttributes, forwardRef, useState, useRef, useEffect, ReactNode, KeyboardEvent } from "react";

export interface Tab {
  id: string;
  label: string;
  content?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "bordered" | "underline" | "gradient";
  lazy?: boolean;
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  isActive?: boolean;
  lazy?: boolean;
}

const variantStyles = {
  default: {
    container: "bg-gray-50/80 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-gray-100 dark:border-zinc-800",
    tab: "ui-not-selected:ui-transparent ui-selected:bg-white ui-selected:dark:bg-zinc-800 ui-selected:shadow-sm",
    tabContent: "ui-not-selected:text-gray-500 ui-selected:text-gray-900 ui-selected:dark:text-white",
  },
  bordered: {
    container: "border-b border-gray-200 dark:border-zinc-700",
    tab: "ui-not-selected:ui-transparent ui-not-selected:border-transparent ui-selected:border-emerald-500 ui-selected:text-emerald-600 ui-selected:dark:text-emerald-400",
    tabContent: "",
  },
  underline: {
    container: "",
    tab: "ui-not-selected:ui-transparent ui-not-selected:text-gray-400 ui-selected:text-gray-900 ui-selected:dark:text-white",
    tabContent: "",
  },
  gradient: {
    container: "bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 p-1 rounded-xl",
    tab: "ui-not-selected:ui-transparent ui-not-selected:text-gray-400 ui-not-selected:hover:text-gray-600 dark:ui-not-selected:hover:text-gray-300 ui-selected:text-gray-900 ui-selected:dark:text-white",
    tabContent: "",
  },
};

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({
    tabs,
    defaultTab,
    activeTab: controlledActiveTab,
    onChange,
    variant = "gradient",
    lazy = true,
    className = "",
    ...props
  }, ref) => {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const tabListRef = useRef<HTMLDivElement>(null);
    
    const isControlled = controlledActiveTab !== undefined;
    const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

    const handleTabChange = (tabId: string) => {
      if (!isControlled) {
        setInternalActiveTab(tabId);
      }
      onChange?.(tabId);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledTabs = tabs.filter(t => !t.disabled);
      const currentIndex = enabledTabs.findIndex(t => t.id === activeTab);

      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % enabledTabs.length;
          handleTabChange(enabledTabs[nextIndex].id);
          setFocusedIndex(enabledTabs.findIndex(t => t.id === enabledTabs[nextIndex].id));
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          handleTabChange(enabledTabs[prevIndex].id);
          setFocusedIndex(enabledTabs.findIndex(t => t.id === enabledTabs[prevIndex].id));
          break;
        }
        case "Home": {
          e.preventDefault();
          handleTabChange(enabledTabs[0].id);
          setFocusedIndex(0);
          break;
        }
        case "End": {
          e.preventDefault();
          handleTabChange(enabledTabs[enabledTabs.length - 1].id);
          setFocusedIndex(enabledTabs.length - 1);
          break;
        }
      }
    };

    useEffect(() => {
      if (focusedIndex >= 0 && tabListRef.current) {
        const buttons = tabListRef.current.querySelectorAll('button[role="tab"]');
        (buttons[focusedIndex] as HTMLButtonElement)?.focus();
      }
    }, [focusedIndex]);

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div
          ref={tabListRef}
          role="tablist"
          className={variantStyles[variant].container}
          onKeyDown={handleKeyDown}
        >
          <div className="flex gap-1 flex-wrap relative">
            {/* Gradient indicator for gradient variant */}
            {variant === "gradient" && (
              <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm" 
                   style={{ 
                     width: `calc(${100 / tabs.filter(t => !t.disabled).length}% - 4px)`,
                     left: `calc(${tabs.filter(t => !t.disabled).findIndex(t => t.id === activeTab) * (100 / tabs.filter(t => !t.disabled).length)}% + 2px)`,
                     transition: 'left 0.2s ease-out'
                   }} 
              />
            )}
            
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isFocused = focusedIndex === tabs.indexOf(tab);
              
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  disabled={tab.disabled}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    relative px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider
                    rounded-lg transition-all duration-150 outline-none z-10
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                    ${variantStyles[variant].tab}
                    ${isActive ? variantStyles[variant].tabContent : ""}
                    ${isFocused ? "ring-2 ring-emerald-500 ring-offset-2" : ""}
                    ${variant === "gradient" ? "hover:text-gray-600 dark:hover:text-gray-300" : ""}
                  `}
                >
                  <span className="flex items-center gap-2 relative z-10">
                    {tab.icon && (
                      <span className={isActive ? "text-emerald-500" : ""}>{tab.icon}</span>
                    )}
                    {tab.label}
                  </span>
                  
                  {/* Gradient underline indicator */}
                  {(variant === "underline" || variant === "gradient") && (
                    <span
                      className={`
                        absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 
                        bg-gradient-to-r from-emerald-500 to-teal-500
                        transition-all duration-200 ease-out
                        ${isActive ? "w-full scale-x-100" : "w-0 scale-x-0"}
                      `}
                    />
                  )}
                  
                  {variant === "bordered" && (
                    <span
                      className={`
                        absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500
                        transition-transform duration-150
                        ${isActive ? "scale-x-100" : "scale-x-0"}
                      `}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Tab panels with lazy fade-in */}
        <div className="mt-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            if (lazy && !isActive) {
              return (
                <div
                  key={tab.id}
                  role="tabpanel"
                  id={`panel-${tab.id}`}
                  aria-labelledby={`tab-${tab.id}`}
                  hidden
                />
              );
            }
            
            return (
              <div
                key={tab.id}
                role="tabpanel"
                id={`panel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
                hidden={!isActive && lazy}
                className={isActive || !lazy ? "animate-in fade-in slide-in-from-bottom-2 duration-200" : ""}
              >
                {tab.content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Tabs.displayName = "Tabs";

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ isActive = true, lazy = true, className = "", children, ...props }, ref) => {
    if (lazy && !isActive) return null;
    
    return (
      <div
        ref={ref}
        hidden={!isActive && lazy}
        className={`${isActive || !lazy ? "animate-in fade-in slide-in-from-bottom-2 duration-200" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabPanel.displayName = "TabPanel";