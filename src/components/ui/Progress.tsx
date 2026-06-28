"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gradient";
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
}

const variantStyles = {
  default: "bg-gray-900 dark:bg-white",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
};



const trackStyles = {
  default: "bg-gray-100 dark:bg-zinc-800",
  success: "bg-emerald-100/50 dark:bg-emerald-950/50",
  warning: "bg-amber-100/50 dark:bg-amber-950/50",
  danger: "bg-rose-100/50 dark:bg-rose-950/50",
  info: "bg-sky-100/50 dark:bg-sky-950/50",
  gradient: "bg-gray-100/50 dark:bg-zinc-800/50",
};

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({
    value,
    max = 100,
    variant = "gradient",
    size = "md",
    indeterminate = false,
    label,
    showValue = false,
    className = "",
    ...props
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {label}
              </span>
            )}
            {showValue && !indeterminate && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          className={`w-full ${sizeStyles[size]} ${trackStyles[variant]} rounded-full overflow-hidden`}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={`
              ${sizeStyles[size]} ${variantStyles[variant]} rounded-full
              ${indeterminate ? "animate-pulse w-full" : ""}
              transition-all duration-500 ease-out
              ${indeterminate ? "" : "relative overflow-hidden"}
            `}
            style={indeterminate ? {} : { width: `${percentage}%` }}
          >
            {/* Shimmer effect for gradient variant */}
            {variant === "gradient" && !indeterminate && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gradient";
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
}

const circularSizeStyles = {
  sm: { size: 40, stroke: 3 },
  md: { size: 60, stroke: 4 },
  lg: { size: 80, stroke: 5 },
};

const circularColors = {
  default: "#18181b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#f43f5e",
  info: "#0ea5e9",
  gradient: "url(#emerald-gradient)",
};

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({
    value,
    max = 100,
    variant = "gradient",
    size = "md",
    indeterminate = false,
    label,
    showValue = true,
    className = "",
    ...props
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const { size: svgSize, stroke } = circularSizeStyles[size];
    const radius = (svgSize - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const isGradient = variant === "gradient";
    const strokeColor = !isGradient ? circularColors[variant] : undefined;

    return (
      <div ref={ref} className={`inline-flex flex-col items-center ${className}`} {...props}>
        <div className="relative" style={{ width: svgSize, height: svgSize }}>
          <svg
            width={svgSize}
            height={svgSize}
            className={`transform -rotate-90 ${indeterminate ? "animate-spin" : ""}`}
            style={{ animationDuration: indeterminate ? "2s" : undefined }}
          >
            {/* Gradient definition for gradient variant */}
            {isGradient && (
              <defs>
                <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            )}
            
            {/* Background track */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              className="text-gray-100 dark:text-zinc-800"
            />
            {/* Progress */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={indeterminate ? circumference / 2 : strokeDashoffset}
              className={`
                transition-all duration-500 ease-out
                ${isGradient ? "" : "text-gray-900 dark:text-white"}
              `}
              style={isGradient ? { stroke: "url(#emerald-gradient)" } : {}}
            />
          </svg>
          
          {/* Indeterminate shimmer */}
          {indeterminate && (
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 animate-pulse" />
          )}
          
          {showValue && !indeterminate && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <span className="mt-2 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";