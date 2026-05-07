'use client';

import { useTranslation } from '@/hooks';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('home.title')}
          </p>
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('navigation.about')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
