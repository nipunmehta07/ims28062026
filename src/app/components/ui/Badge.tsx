"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gradient";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  pulse?: boolean;
  gradientDirection?: "horizontal" | "diagonal";
}

const variantStyles = {
  default: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  neutral: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
  gradient: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded",
  md: "px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg",
  lg: "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-xl",
};

const dotColors = {
  default: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-white dark:bg-black",
  gradient: "bg-white",
};

const gradientDirections = {
  horizontal: "bg-gradient-to-r",
  diagonal: "bg-gradient-to-br",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", dot, pulse, gradientDirection = "horizontal", className = "", children, ...props }, ref) => {
    const isGradient = variant === "gradient";
    
    return (
      <span
        ref={ref}
        className={[
          variantStyles[variant],
          isGradient ? gradientDirections[gradientDirection] : "",
          sizeStyles[size],
          pulse && "relative",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {/* Pulse dot */}
        {dot && (
          <span className="relative flex items-center">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? "animate-pulse" : ""}`} />
            {pulse && (
              <span className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-ping opacity-50`} />
            )}
            <span className={className.includes("gap") ? "" : "ml-1.5"}>
              {children}
            </span>
          </span>
        )}
        
        {/* Non-dot content */}
        {!dot && children}
        
        {/* Gradient shine */}
        {isGradient && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-inherit" />
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";