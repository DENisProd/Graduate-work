'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks';

export function SimpleArtErrorPage({
  code,
  titleKey,
  subtitleKey,
  artAriaLabelKey,
}: {
  code: '404' | '503';
  titleKey: Parameters<ReturnType<typeof useTranslation>['t']>[0];
  subtitleKey: Parameters<ReturnType<typeof useTranslation>['t']>[0];
  artAriaLabelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0];
}) {
  const { t, ready } = useTranslation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="absolute -bottom-36 left-[-120px] h-[520px] w-[520px] rounded-full bg-[var(--brand-teal)]/10 blur-3xl dark:bg-[var(--brand-teal)]/12" />
        <div className="absolute -bottom-40 right-[-140px] h-[560px] w-[560px] rounded-full bg-[var(--brand-secondary)]/10 blur-3xl dark:bg-[var(--brand-secondary)]/12" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-18 md:py-22">
        <div className="mb-8 mt-4 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">{t('errors.oops.hint')}</p>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
            {t(titleKey)}
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
            {t(subtitleKey)}
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-[760px]">
            <Card className="bg-card/60 shadow-lg backdrop-blur dark:bg-card/35">
              <Card.Content className="p-4 md:p-6">
                <div
                  className={[
                    'mx-auto w-full max-w-[720px]',
                    '[--art-house-fill:var(--card)]',
                    '[--art-house-stroke:var(--border)]',
                    '[--art-panel-fill:var(--background)]',
                    '[--art-panel-stroke:var(--border)]',
                    '[--art-grid-stroke:var(--border)]',
                    '[--art-roof-stroke:var(--primary)]',
                    'dark:[--art-house-fill:var(--surface-3)]',
                    'dark:[--art-house-stroke:var(--muted-foreground)]',
                    'dark:[--art-panel-fill:var(--surface-1)]',
                    'dark:[--art-panel-stroke:var(--muted-foreground)]',
                    'dark:[--art-grid-stroke:var(--muted-foreground)]',
                    'dark:[--art-roof-stroke:var(--brand-secondary)]',
                  ].join(' ')}
                >
                  <svg
                    viewBox="0 0 980 520"
                    className="h-auto w-full"
                    role="img"
                    aria-label={t(artAriaLabelKey)}
                  >
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="var(--primary)" stopOpacity="0.22" />
                        <stop offset="1" stopColor="var(--accent)" stopOpacity="0.08" />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0" stopColor="var(--muted-foreground)" stopOpacity="0.08" />
                        <stop offset="1" stopColor="var(--primary)" stopOpacity="0.16" />
                      </linearGradient>
                      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feColorMatrix
                          in="blur"
                          type="matrix"
                          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .55 0"
                          result="glow"
                        />
                        <feMerge>
                          <feMergeNode in="glow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow
                          dx="0"
                          dy="12"
                          stdDeviation="18"
                          floodColor="var(--foreground)"
                          floodOpacity="0.12"
                        />
                      </filter>
                    </defs>

                    <rect x="0" y="0" width="980" height="520" rx="28" fill="url(#g2)" />
                    <g opacity="0.35">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <path
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          d={`M ${40 + i * 50} 30 V 490`}
                          stroke="var(--art-grid-stroke)"
                          strokeWidth="1"
                        />
                      ))}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <path
                          // eslint-disable-next-line react/no-array-index-key
                          key={`h${i}`}
                          d={`M 30 ${60 + i * 45} H 950`}
                          stroke="var(--art-grid-stroke)"
                          strokeWidth="1"
                        />
                      ))}
                    </g>

                    <g filter="url(#shadow)">
                      <path
                        d="M210 268 L490 78 L770 268 V448 C770 470 752 488 730 488 H250 C228 488 210 470 210 448 Z"
                        fill="var(--art-house-fill)"
                        stroke="var(--art-house-stroke)"
                        strokeWidth="2"
                      />
                      <path
                        d="M210 268 L490 78 L770 268"
                        fill="none"
                        stroke="var(--art-roof-stroke)"
                        strokeOpacity="0.5"
                        strokeWidth="8"
                        strokeLinejoin="round"
                      />

                      <g opacity="0.95">
                        {[
                          [300, 308],
                          [410, 308],
                          [520, 308],
                          [630, 308],
                        ].map(([x, y], idx) => (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width="70"
                              height="70"
                              rx="12"
                              fill="var(--art-panel-fill)"
                              stroke="var(--art-panel-stroke)"
                              strokeWidth="2"
                            />
                            <path
                              d={`M ${x + 35} ${y + 8} V ${y + 62}`}
                              stroke="var(--art-panel-stroke)"
                              strokeWidth="2"
                            />
                            <path
                              d={`M ${x + 8} ${y + 35} H ${x + 62}`}
                              stroke="var(--art-panel-stroke)"
                              strokeWidth="2"
                            />
                          </g>
                        ))}
                      </g>

                      <path
                        d="M450 488 V362 C450 346 463 333 479 333 H501 C517 333 530 346 530 362 V488"
                        fill="var(--art-panel-fill)"
                        stroke="var(--art-panel-stroke)"
                        strokeWidth="2"
                      />
                      <circle cx="518" cy="414" r="5" fill="var(--muted-foreground)" />
                    </g>

                    <g filter="url(#softGlow)">
                      <path
                        d="M736 154 C720 128 688 114 657 126 C640 98 603 90 577 112 C548 102 518 120 512 148 C486 152 466 175 470 201 C474 230 502 250 532 244 H716 C748 244 774 219 774 188 C774 169 758 154 736 154 Z"
                        fill="url(#g1)"
                        stroke="var(--primary)"
                        strokeOpacity="0.28"
                        strokeWidth="2"
                      />
                      <g opacity="0.9">
                        <path
                          d="M604 196 C620 180 646 180 662 196"
                          fill="none"
                          stroke="var(--primary)"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M590 182 C614 158 652 158 676 182"
                          fill="none"
                          stroke="var(--primary)"
                          strokeOpacity="0.75"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M576 168 C608 136 658 136 690 168"
                          fill="none"
                          stroke="var(--primary)"
                          strokeOpacity="0.55"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <circle cx="633" cy="206" r="6" fill="var(--primary)" />
                      </g>
                    </g>

                    <g>
                      <text
                        x="110"
                        y="160"
                        fill="var(--foreground)"
                        fontSize="86"
                        fontWeight="700"
                        fontFamily="var(--font-manrope), system-ui, -apple-system, Segoe UI, sans-serif"
                        opacity="0.92"
                      >
                        {code}
                      </text>
                      <text
                        x="110"
                        y="205"
                        fill="var(--muted-foreground)"
                        fontSize="20"
                        fontWeight="600"
                        fontFamily="var(--font-manrope), system-ui, -apple-system, Segoe UI, sans-serif"
                        opacity="0.9"
                      >
                        {code === '404' ? t('errors.oops.404.engLine') : t('errors.oops.503.engLine')}
                      </text>
                    </g>
                  </svg>
                </div>
              </Card.Content>
            </Card>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-[760px] grid-cols-2 gap-3">
            <Card className="bg-card/60 shadow-sm backdrop-blur transition-colors hover:bg-card/75 dark:bg-card/35 dark:hover:bg-card/45">
              <Card.Content className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 3l9 8h-3v10H6V11H3l9-8Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t('navigation.home')}</p>
                    <p className="text-xs text-muted-foreground">{t('errors.oops.actions.homeHint')}</p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/">{t('common.open')}</Link>
                </Button>
              </Card.Content>
            </Card>

            <Card className="border border-border bg-card/60 shadow-sm backdrop-blur transition-colors hover:bg-card/75 dark:bg-card/35 dark:hover:bg-card/45">
              <Card.Content className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] dark:bg-[var(--brand-teal)]/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 6h16M4 12h10M4 18h16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t('navigation.dashboard')}</p>
                    <p className="text-xs text-muted-foreground">{t('errors.oops.actions.dashboardHint')}</p>
                  </div>
                </div>
                <Button asChild variant="secondary">
                  <Link href="/dashboard">{t('common.open')}</Link>
                </Button>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

