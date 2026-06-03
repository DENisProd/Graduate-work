import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/shared';
import { ConditionalLayout } from '@/components/layout';
import { AuthSessionProvider } from '@/features/auth/ui/session-provider';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'Домовой',
    template: '%s | Домовой',
  },
  description: 'Домовой — система умного дома. Управляйте устройствами и автоматизациями в одном месте.',
  keywords: ['умный дом', 'домовой', 'автоматизация', 'IoT', 'устройства'],
  authors: [{ name: 'Domovoy Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

const themeScript = `
  (function() {
    try {
      const stored = localStorage.getItem('smart-home-theme');
      const theme = stored ? JSON.parse(stored).state?.theme : 'system';
      const resolved = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      const root = document.documentElement;
      const html = document.querySelector('html');
      
      root.classList.remove('light', 'dark');
      if (html) {
        html.classList.remove('light', 'dark');
      }
      
      root.classList.add(resolved);
      if (html) {
        html.classList.add(resolved);
      }
      
      root.setAttribute('data-theme', resolved);
      if (html) {
        html.setAttribute('data-theme', resolved);
      }
      
      root.style.colorScheme = resolved;
    } catch (e) {
      const root = document.documentElement;
      const html = document.querySelector('html');
      root.classList.add('light');
      if (html) {
        html.classList.add('light');
      }
      root.setAttribute('data-theme', 'light');
      if (html) {
        html.setAttribute('data-theme', 'light');
      }
      root.style.colorScheme = 'light';
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}>
        <ToastProvider>
          <AuthSessionProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AuthSessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

