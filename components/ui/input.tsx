import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[14px] font-semibold text-[#1E293B]">
            {label}
            {props.required && <span className="text-[#B91C1C] ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full h-12 px-4 text-[15px] text-[#334155] placeholder-[#94A3B8] bg-white border rounded-xl transition-all outline-none ${
            error
              ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15'
          } disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[12px] text-[#B91C1C] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-[14px] font-semibold text-[#1E293B]">
            {label}
            {props.required && <span className="text-[#B91C1C] ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full h-12 px-4 text-[15px] text-[#334155] bg-white border rounded-xl transition-all outline-none ${
            error
              ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15'
          } disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="text-[12px] text-[#B91C1C] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

