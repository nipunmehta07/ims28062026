"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => string;
  error: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => string;
  warning: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => string;
  info: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => string;
  loading: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  position?: "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";
}

const positionStyles = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

const variantStyles = {
  success: "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-lg shadow-emerald-500/10",
  error: "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-lg shadow-rose-500/10",
  warning: "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-lg shadow-amber-500/10",
  info: "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 shadow-lg shadow-sky-500/10",
  loading: "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white shadow-lg",
};

const variantIconColors = {
  success: "text-emerald-500",
  error: "text-rose-500",
  warning: "text-amber-500",
  info: "text-sky-500",
  loading: "text-gray-400",
};

const variantIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

export function ToastProvider({ children, position = "top-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? (toast.variant === "loading" ? 0 : 5000);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => {
    return addToast({ message, variant: "success", ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => {
    return addToast({ message, variant: "error", ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => {
    return addToast({ message, variant: "warning", ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => {
    return addToast({ message, variant: "info", ...options });
  }, [addToast]);

  const loading = useCallback((message: string, options?: Partial<Omit<Toast, "id" | "message" | "variant">>) => {
    return addToast({ message, variant: "loading", ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, loading }}>
      {children}
      {typeof window !== "undefined" && createPortal(
        <div 
          className={`fixed ${positionStyles[position]} z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none`}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast, index) => {
            const Icon = variantIcons[toast.variant];
            return (
              <div
                key={toast.id}
                className={`
                  pointer-events-auto flex items-start gap-3 p-4 rounded-xl border
                  shadow-lg backdrop-blur-xl
                  animate-in slide-in-from-right fade-in duration-300
                  ${variantStyles[toast.variant]}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                role="alert"
                aria-live="polite"
              >
                {/* Accent bar */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-l-xl
                  ${toast.variant === "success" ? "bg-emerald-500" : ""}
                  ${toast.variant === "error" ? "bg-rose-500" : ""}
                  ${toast.variant === "warning" ? "bg-amber-500" : ""}
                  ${toast.variant === "info" ? "bg-sky-500" : ""}
                  ${toast.variant === "loading" ? "bg-gray-400" : ""}
                `} />
                
                <Icon
                  size={18}
                  className={`flex-shrink-0 mt-0.5 ${variantIconColors[toast.variant]} ${toast.variant === "loading" ? "animate-spin" : ""}`}
                />
                
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-[12px] font-medium">{toast.message}</p>
                  {toast.action && (
                    <button
                      onClick={toast.action.onClick}
                      className="mt-2 text-[10px] font-bold uppercase tracking-wider hover:underline text-emerald-600 dark:text-emerald-400 transition-colors"
                    >
                      {toast.action.label}
                    </button>
                  )}
                  
                  {/* Progress bar for timed toasts */}
                  {toast.variant !== "loading" && toast.duration && toast.duration > 0 && (
                    <div className="mt-2 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`
                          h-full transition-all duration-100 ease-linear
                          ${toast.variant === "success" ? "bg-emerald-500" : ""}
                          ${toast.variant === "error" ? "bg-rose-500" : ""}
                          ${toast.variant === "warning" ? "bg-amber-500" : ""}
                          ${toast.variant === "info" ? "bg-sky-500" : ""}
                        `}
                        style={{ 
                          width: "100%",
                          animation: `shrink ${toast.duration}ms linear forwards`
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`
                    flex-shrink-0 p-1 rounded-lg transition-all duration-150
                    hover:bg-gray-100 dark:hover:bg-zinc-800 opacity-60 hover:opacity-100
                    ${toast.variant === "success" ? "hover:text-emerald-600" : ""}
                    ${toast.variant === "error" ? "hover:text-rose-600" : ""}
                  `}
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export { ToastContext };