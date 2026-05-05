'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const DomovoyMark = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    width="32"
    height="32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <defs>
      <linearGradient id="domovoy-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--primary)" />
        <stop offset="0.55" stopColor="var(--brand-teal)" />
        <stop offset="1" stopColor="var(--brand-secondary)" />
      </linearGradient>
    </defs>

    {/* Soft badge */}
    <rect x="3" y="3" width="26" height="26" rx="9" fill="url(#domovoy-g)" opacity="0.14" />
    <rect x="3" y="3" width="26" height="26" rx="9" stroke="url(#domovoy-g)" opacity="0.35" />

    {/* House outline */}
    <path
      d="M9.2 15.2L16 10l6.8 5.2v8.3c0 1-.8 1.8-1.8 1.8H11c-1 0-1.8-.8-1.8-1.8v-8.3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M13.3 25v-6.2c0-.7.6-1.3 1.3-1.3h2.8c.7 0 1.3.6 1.3 1.3V25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

    {/* “Domovoy eyes” */}
    <path
      d="M13.1 16.3c.9-.7 1.9-1.1 2.9-1.1s2 .4 2.9 1.1"
      stroke="url(#domovoy-g)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M14.2 17.7h0.01M17.8 17.7h0.01"
      stroke="url(#domovoy-g)"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Warm “hearth” dot */}
    <circle cx="24.4" cy="11.1" r="1.4" fill="var(--brand-secondary)" opacity="0.9" />
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
