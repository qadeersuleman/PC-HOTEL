import React from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageContainer({ title, subtitle, actions, children, breadcrumbs }: PageContainerProps) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-[13px] text-[#64748B]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[#0F766E] transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-semibold text-[#334155]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172554]">{title}</h1>
          {subtitle && <p className="text-[14px] text-[#64748B] mt-1 leading-normal">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
      </div>

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
