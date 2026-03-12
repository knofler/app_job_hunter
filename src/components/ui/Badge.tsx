import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'badge inline-flex items-center font-medium';
    
    const variants = {
      success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      warning: 'bg-amber-100 text-amber-700 border border-amber-200',
      error: 'bg-rose-100 text-rose-700 border border-rose-200',
      info: 'bg-blue-100 text-blue-700 border border-blue-200',
      neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
      primary: 'bg-primary/10 text-primary border border-primary/20',
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs rounded-full',
      md: 'px-2.5 py-0.5 text-xs rounded-full',
      lg: 'px-3 py-1 text-sm rounded-full',
    };
    
    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
