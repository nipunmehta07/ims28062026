"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "no-data" | "error" | "loading" | "success" | "search" | "filter";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const variantIllustrations = {
  "no-data": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      {/* Background circle with gradient */}
      <circle cx="70" cy="70" r="60" className="fill-emerald-50/50 dark:fill-emerald-950/30" />
      <circle cx="70" cy="70" r="50" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Document icon */}
      <rect x="45" y="50" width="50" height="45" rx="6" className="stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="2" fill="none" />
      <line x1="55" y1="62" x2="85" y2="62" className="stroke-emerald-300 dark:stroke-emerald-700" strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="70" x2="80" y2="70" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="78" x2="72" y2="78" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="2" strokeLinecap="round" />
      
      {/* Magnifying glass */}
      <circle cx="95" cy="95" r="12" className="fill-white dark:fill-zinc-900 stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="2" />
      <line x1="103" y1="103" x2="112" y2="112" className="stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "error": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      {/* Background circle */}
      <circle cx="70" cy="70" r="60" className="fill-rose-50/50 dark:fill-rose-950/30" />
      
      {/* Warning triangle */}
      <path d="M70 40 L100 95 H40 Z" className="stroke-rose-400 dark:stroke-rose-600" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <line x1="70" y1="58" x2="70" y2="72" className="stroke-rose-500 dark:stroke-rose-500" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="80" r="2" className="fill-rose-500 dark:fill-rose-500" />
      
      {/* Decorative elements */}
      <circle cx="45" cy="50" r="3" className="fill-rose-200 dark:fill-rose-800" />
      <circle cx="95" cy="55" r="2" className="fill-rose-200 dark:fill-rose-800" />
    </svg>
  ),
  "loading": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      {/* Background circle */}
      <circle cx="70" cy="70" r="60" className="fill-sky-50/50 dark:fill-sky-950/30" />
      
      {/* Spinning circle */}
      <circle cx="70" cy="70" r="30" className="stroke-sky-200 dark:stroke-sky-800" strokeWidth="3" fill="none" strokeDasharray="60 100" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 70 70"
          to="360 70 70"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Center dot */}
      <circle cx="70" cy="70" r="6" className="fill-sky-500" />
      
      {/* Orbiting dots */}
      <circle cx="70" cy="35" r="4" className="fill-sky-400 dark:fill-sky-600">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 70 70"
          to="360 70 70"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  ),
  "success": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      {/* Background circle */}
      <circle cx="70" cy="70" r="60" className="fill-emerald-50/50 dark:fill-emerald-950/30" />
      
      {/* Checkmark circle */}
      <circle cx="70" cy="70" r="35" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="2" fill="none" />
      
      {/* Checkmark */}
      <path d="M50 70 L63 83 L92 54" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <animate
          attributeName="stroke-dasharray"
          from="0 100"
          to="100 0"
          dur="0.6s"
          fill="freeze"
        />
      </path>
      
      {/* Sparkles */}
      <circle cx="45" cy="45" r="3" className="fill-emerald-300 dark:fill-emerald-700">
        <animate
          attributeName="opacity"
          values="0.5;1;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="100" cy="50" r="2" className="fill-emerald-300 dark:fill-emerald-700">
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="95" cy="100" r="2.5" className="fill-emerald-300 dark:fill-emerald-700">
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  ),
  "search": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      <circle cx="70" cy="70" r="60" className="fill-gray-50/50 dark:fill-zinc-900/30" />
      
      {/* Large magnifying glass */}
      <circle cx="65" cy="65" r="28" className="fill-white dark:fill-zinc-800 stroke-gray-300 dark:stroke-zinc-600" strokeWidth="3" />
      <line x1="85" y1="85" x2="105" y2="105" className="stroke-gray-300 dark:stroke-zinc-600" strokeWidth="4" strokeLinecap="round" />
      
      {/* Question mark in glass */}
      <path d="M55 60 Q55 50 65 50 Q75 50 75 58 Q75 63 65 65 L65 72" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="65" cy="78" r="2" className="fill-gray-400 dark:fill-gray-500" />
    </svg>
  ),
  "filter": (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mb-6">
      <circle cx="70" cy="70" r="60" className="fill-amber-50/50 dark:fill-amber-950/30" />
      
      {/* Funnel shape */}
      <path d="M40 50 L100 50 L85 75 L85 95 L55 95 L55 75 Z" className="stroke-amber-400 dark:stroke-amber-600" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      
      {/* Lines in funnel */}
      <line x1="50" y1="50" x2="90" y2="50" className="stroke-amber-300 dark:stroke-amber-700" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="62" x2="82" y2="62" className="stroke-amber-200 dark:stroke-amber-800" strokeWidth="2" strokeLinecap="round" />
      
      {/* X marks (showing nothing to filter) */}
      <line x1="45" y1="85" x2="52" y2="92" className="stroke-rose-300 dark:stroke-rose-700" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="85" x2="45" y2="92" className="stroke-rose-300 dark:stroke-rose-700" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const variantTitles = {
  "no-data": "No Data Available",
  "error": "Something Went Wrong",
  "loading": "Loading...",
  "success": "Success",
  "search": "No Results Found",
  "filter": "No Matching Items",
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ variant = "no-data", title, description, action, secondaryAction, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center text-center py-16 px-8 ${className}`}
        {...props}
      >
        {variantIllustrations[variant]}
        <h3 className="text-[13px] font-bold text-gray-900 dark:text-white tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
          {title || variantTitles[variant]}
        </h3>
        {description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mb-8">
            {description}
          </p>
        )}
        {action && (
          <Button variant="gradient" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-150"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export interface EmptyStateSectionProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyStateSection = forwardRef<HTMLDivElement, EmptyStateSectionProps>(
  ({ icon, title, description, action, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
        {...props}
      >
        {icon && (
          <div className="w-12 h-12 mb-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center text-gray-300 dark:text-gray-600">
            {icon}
          </div>
        )}
        <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          {title}
        </h4>
        {description && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 text-[9px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {action.label}
          </button>
        )}
        {children}
      </div>
    );
  }
);

EmptyStateSection.displayName = "EmptyStateSection";