"use client";

import { forwardRef, ReactNode, useEffect, useCallback, useRef } from "react";
import { Modal, Button } from "@/components/ui";
import { AlertTriangle, Info, XCircle, Loader2, ShieldCheck, Sparkles } from "lucide-react";

export type ConfirmDialogVariant = "default" | "warning" | "danger" | "success" | "info";

export interface ConfirmDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  confirmDisabled?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  persistent?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    confirmVariant: "primary" | "danger" | "gradient";
    borderClass: string;
    gradientFrom: string;
    gradientTo: string;
    shadowClass: string;
  }
> = {
  default: {
    icon: <Sparkles size={24} />,
    iconBg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    confirmVariant: "gradient",
    borderClass: "border-emerald-200/50 dark:border-emerald-800/30",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
    shadowClass: "shadow-emerald-500/20",
  },
  warning: {
    icon: <AlertTriangle size={24} />,
    iconBg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
    iconColor: "text-amber-500 dark:text-amber-400",
    confirmVariant: "gradient",
    borderClass: "border-amber-200/50 dark:border-amber-800/30",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-500",
    shadowClass: "shadow-amber-500/20",
  },
  danger: {
    icon: <XCircle size={24} />,
    iconBg: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50",
    iconColor: "text-rose-500 dark:text-rose-400",
    confirmVariant: "danger",
    borderClass: "border-rose-200/50 dark:border-rose-800/30",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-500",
    shadowClass: "shadow-rose-500/20",
  },
  success: {
    icon: <ShieldCheck size={24} />,
    iconBg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    confirmVariant: "gradient",
    borderClass: "border-emerald-200/50 dark:border-emerald-800/30",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-500",
    shadowClass: "shadow-emerald-500/20",
  },
  info: {
    icon: <Info size={24} />,
    iconBg: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50",
    iconColor: "text-sky-500 dark:text-sky-400",
    confirmVariant: "gradient",
    borderClass: "border-sky-200/50 dark:border-sky-800/30",
    gradientFrom: "from-sky-500",
    gradientTo: "to-blue-500",
    shadowClass: "shadow-sky-500/20",
  },
};

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({
    isOpen,
    onClose,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
    confirmDisabled = false,
    showCancel = true,
    showConfirm = true,
    icon,
    size = "md",
    persistent = false,
    onConfirm,
    onCancel,
    className = "",
    ...props
  }, ref) => {
    const config = variantConfig[variant];
    const displayIcon = icon || config.icon;
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Focus trap
    const handleFocusTrap = useCallback((e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }, []);

    // Store previous active element and focus first element on open
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        
        // Focus first focusable element after a short delay
        setTimeout(() => {
          if (dialogRef.current) {
            const firstFocusable = dialogRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            firstFocusable?.focus();
          }
        }, 50);

        document.addEventListener("keydown", handleFocusTrap);
      }
      
      return () => {
        document.removeEventListener("keydown", handleFocusTrap);
        // Restore focus when closing
        if (!isOpen && previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }, [isOpen, handleFocusTrap]);

    const handleConfirm = () => {
      onConfirm?.();
    };

    const handleCancel = () => {
      onCancel?.();
      onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !persistent) {
        onClose();
      }
    };

    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size={size}
        showCloseButton={!persistent}
        closeOnBackdrop={!persistent}
        closeOnEscape={!persistent}
        className={`${config.borderClass} ${className}`}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div ref={dialogRef} className="focus:outline-none">
          {/* Glassmorphism backdrop glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10 rounded-2xl blur-xl opacity-50" />
          
          <div className="relative">
            {/* Icon with animated background */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Icon glow */}
                <div className={`absolute inset-0 ${config.iconBg} rounded-full blur-xl opacity-60`} />
                
                {/* Icon container with gradient border */}
                <div className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center
                  bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-[2px]
                  shadow-lg ${config.shadowClass}
                `}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                    {loading ? (
                      <Loader2 size={24} className="animate-spin text-emerald-500" />
                    ) : (
                      <div className={config.iconColor}>
                        {displayIcon}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Animated rings for success variant */}
                {variant === "success" && !loading && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-[ping_1.5s_ease-out]" />
                    <div className="absolute inset-0 rounded-full border border-emerald-300 animate-[ping_1.5s_ease-out_0.3s]" />
                  </>
                )}
              </div>
            </div>

            {/* Gradient Title */}
            {title && (
              <h2 className="text-lg font-black text-center uppercase tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text mb-3">
                {title}
              </h2>
            )}

            {/* Message with emerald accent */}
            {message && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed flex items-start justify-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {/* Actions with gradient primary */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {showCancel && (
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6"
                >
                  {cancelText}
                </Button>
              )}
              
              {showConfirm && (
                <Button
                  variant={config.confirmVariant}
                  onClick={handleConfirm}
                  disabled={confirmDisabled || loading}
                  isLoading={loading}
                  className={`
                    px-6 shadow-lg ${config.shadowClass}
                    ${config.confirmVariant === "gradient" ? "bg-gradient-to-r " + config.gradientFrom + " " + config.gradientTo : ""}
                  `}
                >
                  {confirmText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;