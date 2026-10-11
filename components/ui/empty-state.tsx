import React from 'react';
import Link from 'next/link';
import { Icons } from './icons';
import { Button } from './button';

interface EmptyStateProps {
  icon?: keyof typeof Icons;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'FileText',
  title,
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const IconComp = Icons[icon] || Icons.FileText;

  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white my-4">
      <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shadow-2xs mb-4">
        <IconComp size={28} />
      </div>
      <h3 className="text-lg font-bold text-[#172554] tracking-tight">{title}</h3>
      <p className="text-[14px] text-[#64748B] max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {action ? (
        <div className="mt-6">{action}</div>
      ) : actionLabel ? (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="sm">
                <span>{actionLabel}</span>
              </Button>
            </Link>
          ) : onAction ? (
            <Button variant="primary" size="sm" onClick={onAction}>
              <span>{actionLabel}</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
