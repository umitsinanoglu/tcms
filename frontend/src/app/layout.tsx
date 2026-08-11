import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Test Case Management System (TCMS)',
  description: 'Enterprise Test Case Management System with Tree Hierarchy and Fast Execution Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased bg-background text-slate-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
