"use client";

import { HTMLAttributes, forwardRef, useState } from "react";
import { User } from "lucide-react";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  status?: "online" | "offline" | "busy" | "away";
  shape?: "circle" | "square" | "rounded";
  statusPulse?: boolean;
}

const sizeStyles = {
  xs: "w-6 h-6 text-[8px]",
  sm: "w-8 h-8 text-[9px]",
  md: "w-10 h-10 text-[10px]",
  lg: "w-12 h-12 text-[11px]",
  xl: "w-16 h-16 text-[12px]",
  "2xl": "w-20 h-20 text-[14px]",
};

const statusSizeStyles = {
  xs: "w-2 h-2 border",
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
  "2xl": "w-5 h-5 border-2",
};

const statusColors = {
  online: "bg-emerald-500 border-white dark:border-zinc-950",
  offline: "bg-gray-400 border-white dark:border-zinc-950",
  busy: "bg-rose-500 border-white dark:border-zinc-950",
  away: "bg-amber-500 border-white dark:border-zinc-950",
};

const shapeStyles = {
  circle: "rounded-full",
  square: "rounded-lg",
  rounded: "rounded-xl",
};

const iconSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 28,
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size = "md", status, shape = "circle", statusPulse, className = "", ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const showImage = src && !imageError;
    const initials = fallback
      ? fallback.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
      : alt
        ? alt.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const hasStatusPulse = status && statusPulse;

    return (
      <div ref={ref} className={`relative inline-flex ${className}`} {...props}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || "Avatar"}
            onError={() => setImageError(true)}
            className={`
              ${sizeStyles[size]} ${shapeStyles[shape]} object-cover 
              bg-gray-100 dark:bg-zinc-800
              ring-2 ring-white dark:ring-zinc-950
            `}
          />
        ) : (
          <div
            className={`
              ${sizeStyles[size]} ${shapeStyles[shape]}
              flex items-center justify-center
              bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900
              text-gray-600 dark:text-gray-300
              font-bold uppercase ring-2 ring-white dark:ring-zinc-950
            `}
          >
            {fallback || alt ? initials : <User size={iconSizes[size]} className="text-gray-400" />}
          </div>
        )}
        
        {/* Status indicator with optional pulse */}
        {status && (
          <span
            className={`
              absolute bottom-0 right-0 
              ${statusSizeStyles[size]} 
              ${shapeStyles.circle} 
              ${statusColors[status]}
              ring-2 ring-white dark:ring-zinc-950
              ${hasStatusPulse ? "animate-pulse" : ""}
            `}
            aria-label={status}
          >
            {/* Pulse ring for online status */}
            {hasStatusPulse && status === "online" && (
              <span className={`absolute inset-0 ${statusSizeStyles[size]} ${shapeStyles.circle} ${statusColors[status]} animate-ping opacity-50`} />
            )}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  overlap?: "sm" | "md" | "lg";
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 4, size = "md", overlap = "md", className = "", children, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    const visibleAvatars = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    const overlapSizes = {
      sm: "-ml-2.5",
      md: "-ml-3.5",
      lg: "-ml-5",
    };

    const countBadgeSizes = {
      xs: "w-6 h-6 text-[8px]",
      sm: "w-8 h-8 text-[9px]",
      md: "w-10 h-10 text-[10px]",
      lg: "w-12 h-12 text-[11px]",
      xl: "w-14 h-14 text-[12px]",
      "2xl": "w-16 h-16 text-[12px]",
    };

    return (
      <div ref={ref} className={`flex items-center ${className}`} {...props}>
        {visibleAvatars.map((child, index) => (
          <div
            key={index}
            className={`
              ${index > 0 ? overlapSizes[overlap] : ""} 
              ring-2 ring-white dark:ring-zinc-950 
              ${shapeStyles.circle}
              transition-transform duration-150 hover:scale-110 hover:z-10
            `}
          >
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={`
              ${overlapSizes[overlap]} 
              ${countBadgeSizes[size]} 
              ${shapeStyles.circle}
              flex items-center justify-center
              bg-gradient-to-br from-emerald-500 to-teal-600 
              text-white font-bold
              ring-2 ring-white dark:ring-zinc-950
              shadow-lg shadow-emerald-500/30
            `}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";