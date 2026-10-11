import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
      <table className={`w-full text-left text-[14px] sm:text-[15px] text-[#334155] ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-[#F8FAFC] text-[12px] uppercase font-bold text-[#64748B] tracking-wider border-b border-[#E2E8F0] ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-[#F1F5F9] ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`h-[56px] hover:bg-[#F8FAFC]/80 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3.5 font-bold whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-5 py-4 align-middle whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}
