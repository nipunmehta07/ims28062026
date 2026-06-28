"use client";

import { forwardRef, ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, Button } from "@/components/ui";

export interface PageHeaderBreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface PageHeaderAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "gradient" | "gradient-dark";
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  breadcrumb?: PageHeaderBreadcrumbItem[];
  actions?: PageHeaderAction[];
  showBreadcrumb?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  size?: "sm" | "md" | "lg";
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
}

const sizeStyles = {
  sm: {
    container: "py-4",
    title: "text-lg",
    description: "text-[10px]",
  },
  md: {
    container: "py-6",
    title: "text-xl",
    description: "text-[11px]",
  },
  lg: {
    container: "py-8",
    title: "text-2xl",
    description: "text-[12px]",
  },
};

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({
    title,
    description,
    breadcrumb,
    actions = [],
    showBreadcrumb = true,
    showTitle = true,
    showDescription = true,
    showActions = true,
    size = "md",
    backHref,
    onBack,
    backLabel = "Back",
    className = "",
    ...props
  }, ref) => {
    const styles = sizeStyles[size];

    const renderBreadcrumb = () => {
      if (!showBreadcrumb || !breadcrumb || breadcrumb.length === 0) return null;

      return (
        <Breadcrumb
          showHome={false}
          className="mb-4"
          separator={
            <span className="text-emerald-400 dark:text-emerald-600 mx-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          }
        >
          {breadcrumb.map((item, index) => (
            <BreadcrumbItem
              key={index}
              href={item.href}
              isCurrent={index === breadcrumb.length - 1}
              icon={item.icon}
              className={index < breadcrumb.length - 1 ? "text-emerald-600 dark:text-emerald-400" : ""}
            >
              {item.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      );
    };

    const renderBackButton = () => {
      if (!backHref && !onBack) return null;

      if (backHref) {
        return (
          <a
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mb-4 group"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform rotate-180 transition-transform group-hover:-translate-x-1"
            >
              <path
                d="M7.5 2L4.5 5L7.5 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {backLabel}
          </a>
        );
      }

      return (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mb-4 group"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform rotate-180 transition-transform group-hover:-translate-x-1"
          >
            <path
              d="M7.5 2L4.5 5L7.5 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </button>
      );
    };

    const renderTitle = () => {
      if (!showTitle) return null;

      return (
        <h1 className={`
          ${styles.title} font-black uppercase tracking-tighter
          bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 
          dark:from-white dark:via-gray-100 dark:to-white
          bg-clip-text
        `}>
          {/* Emerald accent bar */}
          <span className="inline-flex items-center gap-3">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
            {title}
          </span>
        </h1>
      );
    };

    const renderDescription = () => {
      if (!showDescription || !description) return null;

      return (
        <p className={`
          ${styles.description} text-gray-500 dark:text-gray-400 mt-3 max-w-2xl 
          leading-relaxed flex items-start gap-2
        `}>
          <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {description}
        </p>
      );
    };

    const renderActions = () => {
      if (!showActions || actions.length === 0) return null;

      return (
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "secondary"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              isLoading={action.isLoading}
              className={`
                ${action.variant === "gradient" || action.variant === "gradient-dark" 
                  ? "shadow-lg shadow-emerald-500/20" 
                  : ""
                }
                ${action.variant === "secondary" || !action.variant
                  ? "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80"
                  : ""
                }
              `}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={`relative ${styles.container} ${className}`}
        {...props}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20 rounded-2xl" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative">
          {renderBreadcrumb()}
          {renderBackButton()}

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {renderTitle()}
              {renderDescription()}
            </div>
            
            {renderActions()}
          </div>
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export default PageHeader;