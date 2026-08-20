import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Türk Ticaret Bankası - Test Case Management System (TCMS)',
  description: 'Enterprise Test Case Management System with Tree Hierarchy and Fast Execution Dashboard',
  icons: {
    icon: '/brand/favicon.png',
    apple: '/brand/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased bg-background text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200">
        <AuthProvider>
          <ThemeProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


