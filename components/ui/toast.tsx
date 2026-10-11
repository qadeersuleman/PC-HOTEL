'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icons } from './icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
            error: 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]',
            warning: 'bg-[#FFF7ED] border-[#FFEDD5] text-[#C2410C]',
            info: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]',
          }[t.type];

          const IconComponent = {
            success: Icons.CheckCircle,
            error: Icons.AlertTriangle,
            warning: Icons.AlertTriangle,
            info: Icons.FileText,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${typeStyles}`}
            >
              <IconComponent size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold tracking-tight">{t.title}</p>
                {t.message && <p className="text-[13px] opacity-90 mt-0.5 leading-snug">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              >
                <Icons.X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

