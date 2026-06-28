"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  separator?: ReactNode;
  maxItems?: number;
  showHome?: boolean;
}

export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
  href?: string;
  isCurrent?: boolean;
  icon?: ReactNode;
}

const defaultSeparator = (
  <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
);

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator = defaultSeparator, maxItems, showHome = true, className = "", children, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children.filter(Boolean) : [children];
    let itemsToRender = childArray;

    if (maxItems && childArray.length > maxItems) {
      const firstItem = childArray[0];
      const lastItems = childArray.slice(-(maxItems - 1));
      itemsToRender = [firstItem, null, ...lastItems];
    }

    return (
      <nav 
        ref={ref as React.Ref<HTMLElement>} 
        aria-label="Breadcrumb" 
        className={`${className}`} 
        {...props}
      >
        <ol className="flex items-center gap-2 flex-wrap">
          {showHome && (
            <>
              <li>
                <Link
                  href="/"
                  className={`
                    flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider
                    text-gray-400 hover:text-emerald-500 transition-colors duration-150
                  `}
                >
                  <Home size={13} className="text-gray-300 dark:text-gray-600" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              {itemsToRender.length > 0 && (
                <li className="flex items-center opacity-50">{separator}</li>
              )}
            </>
          )}
          {itemsToRender.map((child, index) => {
            if (child === null) {
              return (
                <li key="ellipsis" className="flex items-center">
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wider px-1">
                    •••
                  </span>
                </li>
              );
            }
            return (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mr-2 opacity-50">{separator}</span>}
                {child}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ href, isCurrent = false, icon, className = "", children, ...props }, ref) => {
    const baseClasses = "flex items-center gap-1.5";
    
    if (isCurrent) {
      return (
        <li 
          ref={ref} 
          className={`${baseClasses} ${className}`} 
          aria-current="page" 
          {...props}
        >
          {icon && <span className="text-emerald-500">{icon}</span>}
          <span className={`
            text-[10px] font-bold uppercase tracking-wider
            text-gray-900 dark:text-white
            bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text
          `}>
            {children}
          </span>
        </li>
      );
    }

    return (
      <li ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {icon && <span className="text-gray-400">{icon}</span>}
        <a
          href={href}
          className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-500 transition-colors duration-150 relative group"
        >
          {children}
          {/* Emerald underline on hover */}
          <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-200 group-hover:w-full rounded-full" />
        </a>
      </li>
    );
  }
);

BreadcrumbItem.displayName = "BreadcrumbItem";