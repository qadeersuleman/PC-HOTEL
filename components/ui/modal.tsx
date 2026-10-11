'use client';

import React, { useEffect } from 'react';
import { Icons } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal dialog */}
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidthClasses[maxWidth]} border border-[#E2E8F0]`}
        >
          <div className="flex items-center justify-between border-b border-[#F1F5F9] p-6">
            <div>
              <h3 className="text-xl font-bold text-[#172554] tracking-tight">{title}</h3>
              {description && <p className="text-[13px] text-[#64748B] mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#172554] hover:bg-[#F8FAFC] transition-colors"
              aria-label="Close dialog"
            >
              <Icons.X size={20} />
            </button>
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
