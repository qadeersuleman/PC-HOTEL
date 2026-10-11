import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'primary' | 'purple' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'default', size = 'md', children, className = '', ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    success: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    warning: 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    error: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    primary: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
    purple: 'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]',
    outline: 'bg-transparent text-[#475569] border-[#CBD5E1]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-[12px]',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border tracking-wide transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
