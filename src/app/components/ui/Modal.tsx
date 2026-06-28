"use client";

import { HTMLAttributes, forwardRef, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  variant?: "default" | "alert" | "confirmation" | "glass";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  animate?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
};

const variantStyles = {
  default: "bg-white dark:bg-zinc-900",
  alert: "bg-white dark:bg-zinc-900 border-2 border-rose-200 dark:border-rose-900",
  confirmation: "bg-white dark:bg-zinc-900 border-2 border-emerald-200 dark:border-emerald-900",
  glass: "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10",
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    variant = "default",
    size = "md",
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    animate = true,
    className = "",
    children,
    ...props
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Focus trap
    const handleFocusTrap = useCallback((e: KeyboardEvent) => {
      if (!modalRef.current || !isOpen) return;
      
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }, [isOpen]);

    const handleEscape = useCallback((e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.addEventListener("keydown", handleEscape);
        document.addEventListener("keydown", handleFocusTrap);
        document.body.style.overflow = "hidden";
        
        // Auto-focus first focusable element
        setTimeout(() => {
          const focusable = modalRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }, 100);
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("keydown", handleFocusTrap);
        document.body.style.overflow = "";
        previousActiveElement.current?.focus();
      };
    }, [isOpen, handleEscape, handleFocusTrap]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {/* Backdrop with glassmorphism */}
        <div
          className={`
            absolute inset-0 bg-black/60 backdrop-blur-md
            transition-opacity duration-300
            ${animate ? "animate-in fade-in" : "opacity-100"}
          `}
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal Panel */}
        <div
          ref={(node) => {
            modalRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={`
            relative w-full ${sizeStyles[size]} ${variantStyles[variant]}
            rounded-2xl shadow-2xl
            ${animate 
              ? "animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300" 
              : ""
            }
            ${variant === "glass" ? "backdrop-blur-xl" : ""}
            ${className}
          `}
        >
          {/* Gradient border for glass variant */}
          {variant === "glass" && (
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none" />
          )}
          
          {/* Content */}
          <div className="relative p-8">
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  absolute top-4 right-4 w-10 h-10 rounded-full 
                  flex items-center justify-center
                  transition-all duration-150
                  ${variant === "glass" 
                    ? "bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300 dark:hover:text-white" 
                    : "bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }
                `}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    );

    if (typeof window === "undefined") return null;
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = "Modal";

export const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
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
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => (
    <h2 
      ref={ref} 
      className={`
        text-lg font-bold text-gray-900 dark:text-white
        bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent
        ${className}
      `} 
      {...props}
    >
      {children}
    </h2>
  )
);
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", children, ...props }, ref) => (
    <p ref={ref} className={`mt-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium ${className}`} {...props}>
      {children}
    </p>
  )
);
ModalDescription.displayName = "ModalDescription";

export const ModalContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
ModalContent.displayName = "ModalContent";

export const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={`
        mt-8 flex items-center justify-end gap-3
        pt-4 border-t border-gray-100 dark:border-zinc-800
        bg-gradient-to-r from-transparent via-gray-50 to-transparent dark:via-zinc-900/50
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
);
ModalFooter.displayName = "ModalFooter";

export const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
ModalBody.displayName = "ModalBody";