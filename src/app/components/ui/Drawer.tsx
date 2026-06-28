"use client";

import { HTMLAttributes, forwardRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  position?: "left" | "right";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  variant?: "default" | "glass";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({
    isOpen,
    onClose,
    title,
    size = "md",
    position = "right",
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    variant = "default",
    className = "",
    children,
    ...props
  }, ref) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, handleEscape]);

    // Don't render portal when closed - prevents rendering in wrong position
    if (!isOpen) return null;

    const drawerContent = (
      <>
        {/* Backdrop with glassmorphism */}
        <div
          className={`
            fixed inset-0 z-[60]
            transition-all duration-300 ease-out
            ${isOpen 
              ? "opacity-100 backdrop-blur-md bg-black/60" 
              : "opacity-0 backdrop-blur-none bg-transparent pointer-events-none"
            }
          `}
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div
          ref={ref}
          className={`
            fixed inset-y-0 z-[70] w-full ${sizeStyles[size]}
            transition-all duration-500 ease-out
            ${position === "right" 
              ? `${isOpen ? "translate-x-0" : "translate-x-full"}` 
              : `${isOpen ? "translate-x-0" : "-translate-x-full"}`
            }
            ${variant === "glass" 
              ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-l border-r border-white/20 dark:border-white/10" 
              : "bg-white dark:bg-zinc-900 border-l border-gray-100 dark:border-zinc-800"
            }
            shadow-2xl
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "drawer-title" : undefined}
          {...props}
        >
          <div className="h-full flex flex-col p-8 md:p-10">
            {/* Header */}
            {(title || showCloseButton) && (
              <div 
                className={`
                  flex justify-between items-center mb-8 pb-6 
                  border-b border-gray-100 dark:border-zinc-800
                  bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent
                `}
              >
                {title && (
                  <h2 
                    id="drawer-title" 
                    className={`
                      text-xl font-bold text-gray-900 dark:text-white
                      bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent
                    `}
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-150 active:scale-95
                      ${variant === "glass" 
                        ? "bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300" 
                        : "bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }
                      ml-auto
                    `}
                    aria-label="Close drawer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {children}
            </div>
          </div>
        </div>
      </>
    );

    if (typeof window === "undefined") return null;
    return createPortal(drawerContent, document.body);
  }
);

Drawer.displayName = "Drawer";

export const DrawerHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={`
        mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800 
        bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
);
DrawerHeader.displayName = "DrawerHeader";

export const DrawerTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={`
        text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]
        ${className}
      `} 
      {...props}
    >
      {children}
    </h3>
  )
);
DrawerTitle.displayName = "DrawerTitle";

export const DrawerContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={`
        flex-1 overflow-y-auto pr-2 custom-scrollbar
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
);
DrawerContent.displayName = "DrawerContent";

export const DrawerFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={`
        mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 
        flex items-center gap-3
        bg-gradient-to-r from-transparent via-gray-50 to-transparent dark:via-zinc-900/50
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
);
DrawerFooter.displayName = "DrawerFooter";

export default Drawer;