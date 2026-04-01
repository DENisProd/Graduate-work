import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/shared';
import { ConditionalLayout } from '@/components/layout';
import { AuthSessionProvider } from '@/features/auth/ui/session-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: {
    default: 'Smart Home System',
    template: '%s | Smart Home',
  },
  description: 'Control your smart home with ease. Manage all your devices and rooms from one place.',
  keywords: ['smart home', 'home automation', 'IoT', 'devices'],
  authors: [{ name: 'Smart Home Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// Скрипт для предотвращения мигания темы при загрузке
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
      
      // Удаляем все классы тем
      root.classList.remove('light', 'dark');
      if (html) {
        html.classList.remove('light', 'dark');
      }
      
      // Добавляем нужный класс
      root.classList.add(resolved);
      if (html) {
        html.classList.add(resolved);
      }
      
      // Устанавливаем data-theme атрибут
      root.setAttribute('data-theme', resolved);
      if (html) {
        html.setAttribute('data-theme', resolved);
      }
      
      // Устанавливаем color-scheme
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <AuthSessionProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AuthSessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

