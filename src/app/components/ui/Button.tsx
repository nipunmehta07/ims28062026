"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "gradient" | "gradient-dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  shimmer?: boolean;
}

const variantStyles = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300",
  secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
  danger: "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-rose-400 dark:text-rose-950",
  outline: "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
  gradient: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 shadow-md hover:shadow-lg hover:shadow-emerald-500/25 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:from-emerald-400 dark:to-teal-500 dark:text-emerald-950",
  "gradient-dark": "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white hover:from-emerald-500 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-900 shadow-lg hover:shadow-xl hover:shadow-emerald-900/30",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg",
  md: "px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl",
  lg: "px-8 py-3.5 text-[12px] font-bold uppercase tracking-wider rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, shimmer, children, disabled, className = "", ...props }, ref) => {
    const isGradient = variant === "gradient" || variant === "gradient-dark";
    
    const baseStyles = [
      "inline-flex items-center justify-center gap-2 font-sans transition-all duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "active:scale-[0.97] hover:scale-[1.02]",
    ].join(" ");

    return (
      <button
        ref={ref}
        className={[
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isLoading && "relative overflow-hidden",
          shimmer && "animate-pulse",
          className,
        ].filter(Boolean).join(" ")}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="relative flex items-center gap-2">
            {/* Spinner with pulse-glow */}
            <span className="relative">
              <span className="absolute inset-0 animate-ping opacity-30 rounded-full bg-current" />
              <svg 
                className="h-4 w-4 animate-spin relative z-10" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            <span>{children}</span>
          </span>
        )}
        {!isLoading && children}
        
        {/* Gradient shine effect for gradient variants */}
        {isGradient && !isLoading && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";