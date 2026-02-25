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
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-blue-100 text-blue-800 border border-blue-200',
      neutral: 'bg-slate-100 text-slate-800 border border-slate-200',
      primary: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
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
