"use client";

import { forwardRef, ReactNode, useMemo } from "react";
import { Card, Badge, Button } from "@/components/ui";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

export interface StatCardTrend {
  value: number;
  label?: string;
  direction?: "up" | "down" | "neutral";
}

export interface StatCardAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "gradient";
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: StatCardTrend;
  action?: StatCardAction;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  sparklineData?: number[];
}

const trendIcons = {
  up: <TrendingUp size={12} />,
  down: <TrendingDown size={12} />,
  neutral: <Minus size={12} />,
};

type BadgeVariant = "success" | "danger" | "neutral" | "warning";

const trendColors: Record<"up" | "down" | "neutral", BadgeVariant> = {
  up: "success",
  down: "danger",
  neutral: "neutral",
};

const trendGradientColors: Record<"up" | "down" | "neutral", string> = {
  up: "from-emerald-400 to-teal-500",
  down: "from-rose-400 to-pink-500",
  neutral: "from-gray-400 to-gray-500",
};

const sizeStyles = {
  sm: {
    card: "p-4",
    icon: "w-8 h-8",
    iconText: "text-lg",
    value: "text-xl",
    title: "text-[9px]",
    sparkline: "h-8",
  },
  md: {
    card: "p-6",
    icon: "w-10 h-10",
    iconText: "text-xl",
    value: "text-2xl",
    title: "text-[10px]",
    sparkline: "h-10",
  },
  lg: {
    card: "p-8",
    icon: "w-12 h-12",
    iconText: "text-2xl",
    value: "text-3xl",
    title: "text-[11px]",
    sparkline: "h-12",
  },
};

// Sparkline component for trend visualization
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const path = useMemo(() => {
    if (!data || data.length === 0) return "";
    
    const width = 80;
    const height = 24;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
      {/* Gradient fill area */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Fill area */}
      <path
        d={`${path} L ${80 - 2},24 L 2,24 Z`}
        fill={`url(#sparkline-gradient-${color})`}
        className="transition-all duration-500"
      />
      
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
      
      {/* End dot */}
      <circle
        cx={80 - 2}
        cy={(() => {
          const min = Math.min(...data);
          const max = Math.max(...data);
          const range = max - min || 1;
          const lastValue = data[data.length - 1];
          return 2 + ((max - lastValue) / range) * (24 - 4);
        })()}
        r="3"
        fill={color}
        className="transition-all duration-500"
      >
        <animate
          attributeName="r"
          values="3;4;3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({
    title,
    value,
    icon,
    trend,
    action,
    variant = "gradient",
    size = "md",
    loading = false,
    sparklineData,
    className = "",
    ...props
  }, ref) => {
    const styles = sizeStyles[size];
    const trendDirection: "up" | "down" | "neutral" = trend?.direction ?? (trend ? (trend.value >= 0 ? "up" : "down") : "neutral");
    const trendBadgeVariant: BadgeVariant = trend ? trendColors[trendDirection] : "neutral";
    const trendGradient = trendGradientColors[trendDirection];

    if (loading) {
      return (
        <Card ref={ref} variant="outlined" className={`${styles.card} ${className}`} {...props}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-3 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse mb-3" />
              <div className="h-8 w-28 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse" />
            </div>
            <div className={`${styles.icon} bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl animate-pulse`} />
          </div>
        </Card>
      );
    }

    // Determine card background based on variant
    const cardBgClass = variant === "gradient"
      ? "bg-gradient-to-br from-white to-emerald-50/50 dark:from-zinc-900 dark:to-emerald-950/30"
      : variant === "elevated"
        ? "bg-white dark:bg-zinc-900 shadow-xl shadow-emerald-500/5"
        : "bg-white/80 dark:bg-zinc-900/80";

    const cardBorderClass = variant === "gradient"
      ? "border border-emerald-200/50 dark:border-emerald-800/30"
      : variant === "outlined"
        ? "border border-emerald-200/30 dark:border-emerald-800/30"
        : "";

    return (
      <Card 
        ref={ref} 
        variant="outlined" 
        className={`${styles.card} relative overflow-hidden ${cardBgClass} ${cardBorderClass} ${className} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 group`} 
        {...props}
      >
        {/* Background gradient accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-bl-full opacity-50 group-hover:opacity-75 transition-opacity" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(emerald-500 1px, transparent 1px), linear-gradient(90deg, emerald-500 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title with emerald accent */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
              <p className={`${styles.title} font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest`}>
                {title}
              </p>
            </div>

            {/* Value */}
            <p className={`${styles.value} font-black text-gray-900 dark:text-white truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text`}>
              {value}
            </p>

            {/* Trend with Sparkline */}
            {trend && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Badge variant={trendBadgeVariant} size="sm" className={`bg-gradient-to-r ${trendGradient} text-white border-0`} dot pulse>
                    <span className="flex items-center gap-1">
                      {trendIcons[trendDirection]}
                      {Math.abs(trend.value)}%
                    </span>
                  </Badge>
                  {trend.label && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {trend.label}
                    </span>
                  )}
                </div>
                
                {/* Sparkline chart */}
                {sparklineData && sparklineData.length > 0 && (
                  <Sparkline 
                    data={sparklineData} 
                    color={trendDirection === "up" ? "#10b981" : trendDirection === "down" ? "#f43f5e" : "#6b7280"} 
                  />
                )}
              </div>
            )}

            {/* Action with emerald variant */}
            {action && (
              <Button
                variant={action.variant || "gradient"}
                size="sm"
                onClick={action.onClick}
                className="mt-4 -ml-2 group/btn"
              >
                {action.label}
                <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}
          </div>

          {/* Icon with gradient background */}
          {icon && (
            <div
              className={`
                ${styles.icon} flex items-center justify-center
                bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50
                rounded-xl shadow-lg shadow-emerald-500/10
                text-emerald-600 dark:text-emerald-400
                flex-shrink-0
                transition-transform duration-300 group-hover:scale-110
              `}
            >
              <span className={styles.iconText}>{icon}</span>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

export default StatCard;