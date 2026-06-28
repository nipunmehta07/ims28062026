"use client";

import { forwardRef, ReactNode, isValidElement, cloneElement, useState } from "react";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export interface FormFieldChildProps {
  error?: string;
  disabled?: boolean;
}

const getChildComponent = (child: ReactNode): string | null => {
  if (!isValidElement(child)) return null;
  const type = child.type as { displayName?: string; name?: string };
  return type.displayName || type.name || null;
};

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    children,
    className = "",
    ...props
  }, ref) => {
    const [focused, setFocused] = useState(false);

    const renderEnhancedChild = (child: ReactNode) => {
      if (!isValidElement(child)) return child;
      
      const childProps: FormFieldChildProps & Record<string, unknown> = {
        error,
        disabled,
        onFocus: (e: React.FocusEvent) => {
          setFocused(true);
          const onFocus = (child.props as { onFocus?: (e: React.FocusEvent) => void }).onFocus;
          if (typeof onFocus === 'function') {
            onFocus(e);
          }
        },
        onBlur: (e: React.FocusEvent) => {
          setFocused(false);
          const onBlur = (child.props as { onBlur?: (e: React.FocusEvent) => void }).onBlur;
          if (typeof onBlur === 'function') {
            onBlur(e);
          }
        },
      };
      
      const childType = getChildComponent(child);
      
      if (childType === "Input") {
        return cloneElement(child as React.ReactElement<{ error?: string; disabled?: boolean }>, childProps);
      }
      
      if (childType === "Textarea") {
        return cloneElement(child as React.ReactElement<{ error?: string; disabled?: boolean }>, childProps);
      }
      
      if (childType === "Dropdown" || childType === "SearchableSelect") {
        return cloneElement(child as React.ReactElement<{ error?: string; disabled?: boolean }>, childProps);
      }
      
      if (typeof child.type === "object" && child.type !== null && "render" in child.type) {
        return cloneElement(child as React.ReactElement, childProps);
      }
      
      return child;
    };

    const renderHelperOrError = () => {
      if (error) {
        return (
          <p className="mt-1.5 text-[10px] font-medium text-rose-500 flex items-center gap-1.5 animate-[fadeIn_0.15s_ease-out]" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        );
      }
      if (helperText) {
        return (
          <p className="mt-1.5 text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {helperText}
          </p>
        );
      }
      return null;
    };

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Floating label with animation */}
        {label && (
          <div className="relative mb-2">
            <div className={`
              absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg blur-md
              transition-opacity duration-300
              ${focused && !error ? 'opacity-100' : 'opacity-0'}
            `} />
            <label className={`
              relative block text-[10px] font-black uppercase tracking-widest transition-all duration-200
              ${error ? 'text-rose-500' : focused ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}
            `}>
              {label}
              {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
          </div>
        )}
        
        <div className="relative group">
          {/* Focus ring with emerald gradient */}
          <div className={`
            absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-0
            transition-all duration-300
            ${focused && !error ? 'opacity-30' : ''}
            ${error ? 'from-rose-500 to-rose-600 opacity-30' : ''}
            ${disabled ? 'opacity-0' : ''}
          `} />
          
          {/* Inner glow */}
          <div className={`
            absolute inset-0 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-xl blur-xl
            transition-opacity duration-300
            ${focused && !error ? 'opacity-100' : 'opacity-0'}
          `} />
          
          <div className="relative">
            {Array.isArray(children) ? (
              children.map((child, index) => (
                <div key={index} className={index > 0 ? "mt-2" : ""}>
                  {renderEnhancedChild(child)}
                </div>
              ))
            ) : (
              renderEnhancedChild(children)
            )}
          </div>
        </div>
        
        {/* Helper or Error text with icon */}
        {renderHelperOrError()}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;