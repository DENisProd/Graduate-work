'use client';

import { Button } from '@/components/ui/button';
import { useLanguage, useTranslation } from '@/hooks';
import { localeNames, i18nConfig } from '@/config';
import type { Locale } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/animate-ui/components/radix/dropdown-menu';

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const FlagIcon = ({ locale, className }: { locale: Locale; className?: string }) => {
  if (locale === 'en') {
    return (
      <svg className={className} viewBox="0 0 36 36" width="20" height="20">
        <path fill="#00247D" d="M0 9.059V13h5.628zM4.664 31H13v-5.837zM23 25.164V31h8.335zM0 23v3.941L5.63 23zM31.337 5H23v5.837zM36 26.942V23h-5.631zM36 13V9.059L30.371 13zM13 5H4.664L13 10.837z"/>
        <path fill="#CF1B2B" d="M25.14 23l9.712 6.801c.471-.479.808-1.082.99-1.749L28.627 23H25.14zM13 23h-2.141l-9.711 6.8c.521.53 1.189.909 1.938 1.085L13 23.943V23zM10.86 13L1.148 6.2C.677 6.68.34 7.282.157 7.949L7.372 13h3.488zM23 12.943V13h2.141l9.711-6.8c-.521-.53-1.188-.909-1.937-1.085L23 12.057v.886z"/>
        <path fill="#EEE" d="M36 21H21v10h2v-5.836L31.335 31H32c1.117 0 2.126-.461 2.852-1.199L25.14 23h3.487l7.215 5.052c.093-.337.158-.686.158-1.052v-.058L30.371 23H36v-2zM0 21v2h5.63L0 26.941V27c0 1.091.439 2.078 1.148 2.8l9.711-6.8H13v.943l-9.914 6.942c.294.07.598.115.914.115h.664L13 25.163V31h2V21H0zM36 9c0-1.091-.439-2.078-1.148-2.8L25.141 13H23v-.943l9.915-6.942C32.62 5.046 32.316 5 32 5h-.663L23 10.837V5h-2v10h15v-2h-5.629L36 9.059V9zM13 5v5.837L4.664 5H4c-1.118 0-2.126.461-2.852 1.2l9.711 6.8H7.372L.157 7.949C.065 8.286 0 8.634 0 9v.058L5.628 13H0v2h15V5h-2z"/>
        <path fill="#CF1B2B" d="M21 15V5h-6v10H0v6h15v10h6V21h15v-6z"/>
      </svg>
    );
  }
  
  return (
    <svg className={className} viewBox="0 0 36 36" width="20" height="20">
      <path fill="#CE2028" d="M36 27c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4v-4h36v4z"/>
      <path fill="#22408C" d="M0 13h36v10H0z"/>
      <path fill="#EEE" d="M32 5H4C1.791 5 0 6.791 0 9v4h36V9c0-2.209-1.791-4-4-4z"/>
    </svg>
  );
};

export function LanguageSwitcher() {
  const { locale, setLocale, mounted } = useLanguage();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <Button
        aria-label="Select language"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
      >
        <GlobeIcon className="h-5 w-5" />
      </Button>
    );
  }

  const handleLocaleChange = (key: string | number) => {
    setLocale(key as Locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('language.select')}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
        >
          <FlagIcon locale={locale} className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {i18nConfig.locales.map((loc) => (
            <DropdownMenuRadioItem key={loc} value={loc}>
              <FlagIcon locale={loc} className="mr-2 h-4 w-4" />
              <span className="text-sm">{localeNames[loc]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSelect() {
  const { locale, setLocale, mounted } = useLanguage();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <Button
        aria-label="Select language"
        variant="secondary"
        className="min-w-[120px]"
      >
        <GlobeIcon className="mr-2 h-4 w-4" />
        <span className="w-16" />
      </Button>
    );
  }

  const handleLocaleChange = (key: string | number) => {
    setLocale(key as Locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('language.select')}
          variant="secondary"
          className="min-w-[120px]"
        >
          <FlagIcon locale={locale} className="mr-2 h-4 w-4" />
          {localeNames[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {i18nConfig.locales.map((loc) => (
            <DropdownMenuRadioItem key={loc} value={loc}>
              <FlagIcon locale={loc} className="mr-2 h-4 w-4" />
              <span className="text-sm">{localeNames[loc]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
