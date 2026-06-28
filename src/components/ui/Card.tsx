// src/components/ui/Card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-background-secondary border border-border',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-white', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}