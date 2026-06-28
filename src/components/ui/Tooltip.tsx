"use client";

import { HTMLAttributes, forwardRef, useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  disabled?: boolean;
  arrow?: boolean;
  variant?: "default" | "emerald" | "glass";
}

const positionStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
};

const variantStyles = {
  default: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25",
  glass: "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-gray-900 dark:text-white border border-white/20 dark:border-white/10",
};

const arrowPositions = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-zinc-900 dark:border-t-zinc-100 border-l-transparent border-r-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-zinc-900 dark:border-b-zinc-100 border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-zinc-900 dark:border-l-zinc-100 border-t-transparent border-b-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-zinc-900 dark:border-r-zinc-100 border-t-transparent border-b-transparent border-l-transparent",
};

const emeraldArrowPositions = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-emerald-500 border-l-transparent border-r-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-emerald-500 border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-emerald-500 border-t-transparent border-b-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-emerald-500 border-t-transparent border-b-transparent border-l-transparent",
};

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({
    content,
    children,
    position = "top",
    delay = 200,
    disabled = false,
    arrow = true,
    variant = "default",
    className = "",
    ...props
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showTooltip = () => {
      if (disabled) return;
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const tooltipContent = isVisible && (
      <div
        ref={tooltipRef}
        className={`
          absolute z-[300] ${positionStyles[position]}
          px-3 py-2 text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap
          animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-200
          ${variantStyles[variant]}
          ${variant === "glass" ? "backdrop-blur-xl" : ""}
          ${className}
        `}
        role="tooltip"
        {...props}
      >
        {/* Emerald accent for default variant */}
        {variant === "default" && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-emerald-500 rounded-full" />
        )}
        {content}
        {arrow && (
          <span
            className={`absolute w-0 h-0 border-[6px] ${variant === "emerald" ? emeraldArrowPositions[position] : arrowPositions[position]}`}
          />
        )}
      </div>
    );

    return (
      <>
        <div
          ref={triggerRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className="inline-flex"
        >
          {children}
        </div>
        {typeof window !== "undefined" && isVisible && createPortal(
          tooltipContent,
          document.body
        )}
      </>
    );
  }
);

Tooltip.displayName = "Tooltip";