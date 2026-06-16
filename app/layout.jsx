import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../hooks/useToast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: 'FranchExpress ERP - Courier Service Management',
  description: 'Enterprise resource planner and shipment tracking for FranchExpress Courier Services, built with Next.js and Firebase.',
  icons: {
    icon: '/favicon.png',
  },
};

// Next.js 14+ requires viewport to be a separate named export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};


export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="bg-fe-bg text-fe-dark min-h-screen flex flex-col font-sans antialiased">
        {/* Skip to Main Content Link for Accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-fe-teal text-white px-4 py-2 rounded-lg font-bold shadow-md focus:outline-none focus:ring-2 focus:ring-fe-teal"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
