"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  floating?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, floating, showClear, onClear, className = "", id, value, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";

    
    return (
      <div className="w-full relative">
        {label && !floating && (
          <label 
            htmlFor={inputId} 
            className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 transition-colors duration-150"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            value={value}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full px-4 py-3 bg-white dark:bg-zinc-900 border rounded-xl text-[13px] font-medium outline-none transition-all duration-200
              ${floating ? "pt-5 pb-2" : ""}
              ${error 
                ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/50" 
                : hasValue || focused
                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-500/50 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                  : "border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:hover:border-zinc-600 dark:text-white dark:focus:border-emerald-400"
              }
              ${floating && label ? "placeholder-transparent" : ""}
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            placeholder={floating ? label : props.placeholder}
            {...props}
          />
          
          {/* Floating label */}
          {floating && label && (
            <label
              htmlFor={inputId}
              className={`
                absolute left-4 transition-all duration-200 pointer-events-none
                ${focused || hasValue
                  ? "top-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider"
                  : "top-3.5 text-[13px] text-gray-400"
                }
              `}
            >
              {label}
            </label>
          )}
          
          {/* Clear button */}
          {showClear && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Emerald glow effect on focus */}
        {!error && (focused || hasValue) && (
          <div className="absolute inset-0 -z-10 blur-xl opacity-30 pointer-events-none rounded-xl bg-emerald-500/20 dark:bg-emerald-400/20" />
        )}
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-[10px] font-medium text-rose-500 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  floating?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, floating, className = "", id, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    
    return (
      <div className="w-full relative">
        {label && !floating && (
          <label 
            htmlFor={inputId} 
            className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 transition-colors duration-150"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full px-4 py-3 bg-white dark:bg-zinc-900 border rounded-xl text-[13px] font-medium outline-none transition-all duration-200 resize-none min-h-[100px]
              ${floating ? "pt-5 pb-2" : ""}
              ${error 
                ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/50" 
                : hasValue || focused
                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-500/50 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                  : "border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:hover:border-zinc-600 dark:text-white dark:focus:border-emerald-400"
              }
              ${className}
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            placeholder={floating ? label : props.placeholder}
            {...props}
          />
          
          {/* Floating label */}
          {floating && label && (
            <label
              htmlFor={inputId}
              className={`
                absolute left-4 transition-all duration-200 pointer-events-none
                ${focused || hasValue
                  ? "top-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider"
                  : "top-3.5 text-[13px] text-gray-400"
                }
              `}
            >
              {label}
            </label>
          )}
        </div>
        
        {/* Emerald glow effect on focus */}
        {!error && (focused || hasValue) && (
          <div className="absolute inset-0 -z-10 blur-xl opacity-30 pointer-events-none rounded-xl bg-emerald-500/20 dark:bg-emerald-400/20" />
        )}
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-[10px] font-medium text-rose-500 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";