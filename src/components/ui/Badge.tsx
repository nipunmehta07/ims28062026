// src/components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        danger: 'bg-error/10 text-error',
        gradient: 'bg-gradient-to-r from-accent to-accent-hover text-white border-none',
        neutral: 'bg-bg-tertiary text-text-secondary',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  const dotColor = variant === 'success' ? 'bg-success'
    : (variant === 'error' || variant === 'danger') ? 'bg-error'
    : variant === 'warning' ? 'bg-warning'
    : 'bg-current';

  return (
    <div className={cn(badgeVariants({ variant, size }), pulse && "animate-pulse", className)} {...props}>
      {dot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />}
      {children}
    </div>
  );
}