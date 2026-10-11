import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ERPStorageProvider } from '../lib/storage/context';
import { ToastProvider } from '../components/ui/toast';
import { AppSidebar } from '../components/layout/app-sidebar';
import { AppHeader } from '../components/layout/app-header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GT Road Cafe Taj — Restaurant ERP & Ledger Management',
  description: 'Restaurant Inventory, Accounts, and Vendor Ledger Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#334155]">
        <ERPStorageProvider>
          <ToastProvider>
            <div className="flex min-h-screen bg-[#F8FAFC]">
              {/* 26-module sidebar */}
              <AppSidebar />

              {/* Main content body */}
              <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <AppHeader />
                <main className="flex-1 pb-16">{children}</main>
              </div>
            </div>
          </ToastProvider>
        </ERPStorageProvider>
      </body>
    </html>
  );
}
