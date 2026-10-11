import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  isLoading,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.99]';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs h-9 px-3 gap-1.5',
    md: 'text-[14px] sm:text-[15px] h-11 sm:h-12 px-5 gap-2',
    lg: 'text-base h-13 px-6 gap-2.5',
    icon: 'h-10 w-10 min-w-10 p-0 text-sm',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#0F766E] text-white hover:bg-[#115E59] focus:ring-[#0F766E]/20 shadow-xs border border-[#0F766E]',
    secondary: 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0] focus:ring-slate-300 border border-[#E2E8F0]',
    outline: 'border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] hover:border-[#94A3B8] focus:ring-slate-300 bg-white',
    danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] focus:ring-[#B91C1C]/20 shadow-xs border border-[#B91C1C]',
    ghost: 'text-[#64748B] hover:text-[#0F766E] hover:bg-[#F0FDFA] focus:ring-[#0F766E]/10',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  );
}
