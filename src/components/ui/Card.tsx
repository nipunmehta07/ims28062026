import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'glass' | string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | string;
  radius?: 'none' | 'sm' | 'md' | 'lg' | '2xl' | '3xl' | string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding, radius = 'lg', ...props }, ref) => {
    const variantClasses = variant === 'dark' 
      ? 'bg-zinc-950 text-white border-zinc-800' 
      : variant === 'glass'
      ? 'bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-white/20 dark:border-zinc-800'
      : 'bg-card border-border text-card-foreground shadow-sm';
      
    const paddingClasses = padding === 'none' ? 'p-0'
      : padding === 'sm' ? 'p-4'
      : padding === 'md' ? 'p-6'
      : padding === 'lg' ? 'p-8'
      : '';

    const radiusClasses = radius === 'none' ? 'rounded-none'
      : radius === 'sm' ? 'rounded-sm'
      : radius === 'md' ? 'rounded-md'
      : radius === 'lg' ? 'rounded-xl'
      : radius === '2xl' ? 'rounded-2xl'
      : radius === '3xl' ? 'rounded-3xl'
      : 'rounded-xl';

    return (
      <div
        ref={ref}
        className={cn(
          'border',
          variantClasses,
          paddingClasses,
          radiusClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';


export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-card-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0 flex items-center', className)} {...props} />;
}