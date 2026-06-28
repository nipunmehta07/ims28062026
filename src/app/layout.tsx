// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Zoie ERP',
  description: 'Modern ERP for Zoie Bathware',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-background`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}