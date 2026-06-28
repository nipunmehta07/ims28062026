"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "dark" | "glass" | "glass-dark";
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  radius?: "sm" | "md" | "lg" | "xl" | "2xl";
  gradientBorder?: boolean;
}

const variantStyles = {
  default: "bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800",
  elevated: "bg-white dark:bg-zinc-900 border border-gray-100/50 dark:border-zinc-800/50",
  outlined: "bg-transparent border-2 border-gray-200 dark:border-zinc-700",
  dark: "bg-zinc-950 text-white dark:bg-black border border-white/5 dark:border-zinc-800",
  glass: "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10",
  "glass-dark": "bg-zinc-950/80 dark:bg-black/80 backdrop-blur-xl border border-black/20 dark:border-white/5",
};

const elevationStyles = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

const radiusStyles = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[2rem]",
  "2xl": "rounded-[3rem]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", elevation = "md", padding = "md", radius = "lg", gradientBorder, className = "", children, ...props }, ref) => {
    const isGlass = variant === "glass" || variant === "glass-dark";
    
    return (
      <div
        ref={ref}
        className={[
          variantStyles[variant],
          elevationStyles[elevation],
          paddingStyles[padding],
          radiusStyles[radius],
          gradientBorder && "relative overflow-hidden",
          isGlass && "backdrop-blur-xl",
          className,
        ].filter(Boolean).join(" ")}
        style={gradientBorder ? {
          background: `linear-gradient(${variant === "dark" || variant === "glass-dark" ? "180deg, #18181b, #09090b" : "180deg, #ffffff, #f4f4f5"}, transparent) border-box, linear-gradient(135deg, #10b981, #0ea5e9) border-box`,
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        } : undefined}
        {...props}
      >
        {/* Gradient border overlay */}
        {gradientBorder && (
          <div className="absolute inset-[1px] bg-white dark:bg-zinc-900 rounded-inherit pointer-events-none" style={{ borderRadius: "inherit" }} />
        )}
        <div className={gradientBorder ? "relative z-10" : ""}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
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
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={`
        text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] 
        bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent
        ${className}
      `} 
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
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
CardFooter.displayName = "CardFooter";