'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const DomovoyMark = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    width="100"
    height="100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <polygon
      points="50,10 85,30 85,70 50,90 15,70 15,30"
      fill="none"
      stroke="var(--primary, #1a237e)"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    <path
      d="M30 42 L50 28 L70 42 M38 42 L38 72 M62 42 L62 72 M38 57 L62 57"
      fill="none"
      stroke="var(--brand-teal, #009688)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="57" r="5" fill="var(--brand-secondary, #ff9800)" />
  </svg>
);

interface AppLogoProps {
  label: string;
  href?: string;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
}

export function AppLogo({
  label,
  href = '/',
  className,
  iconClassName,
  labelClassName,
  showLabel = true,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 font-semibold text-lg transition-colors hover:text-accent',
        className,
      )}
    >
      <DomovoyMark className={cn('h-7 w-7 shrink-0 text-current', iconClassName)} />
      {showLabel && <span className={labelClassName}>{label}</span>}
    </Link>
  );
}
