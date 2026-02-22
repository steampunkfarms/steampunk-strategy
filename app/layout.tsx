import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/ui/auth-provider';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Bridge — Steampunk Strategy',
  description: 'Financial management, compliance, and cross-site operations for Steampunk Farms Rescue Barn',
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-tardis-dim text-slate-100 font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
