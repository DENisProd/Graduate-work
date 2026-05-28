'use client';

import { useRef, type ComponentProps, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  Bot,
  Briefcase,
  Building2,
  Cloud,
  Home,
  KeyRound,
  Layers,
  Map,
  Monitor,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Store,
  UserPlus,
  Warehouse,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/spotlight-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ThemeInitializer } from '@/components/shared';
import { useLandingGsap, useTranslation } from '@/hooks';
import { cn } from '@/lib/utils';

type FeatureKey =
  | 'hybrid'
  | 'access'
  | 'protocols'
  | 'multisite'
  | 'realtime'
  | 'ai';

type AudienceKey = 'home' | 'office' | 'retail' | 'warehouse';

type ArchitectureKey = 'cloud' | 'edge' | 'client';

type UseCaseKey = 'onboard' | 'floorplan' | 'offline' | 'sync' | 'ai' | 'multisite';

type ValuePropKey = 'scale' | 'integration' | 'security';

type BrandAccent = 'indigo' | 'teal' | 'hearth';

const accentIconClass: Record<BrandAccent, string> = {
  indigo: 'landing-icon-indigo',
  teal: 'landing-icon-teal',
  hearth: 'landing-icon-hearth',
};

const accentTopLine: Record<BrandAccent, string> = {
  indigo: 'linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--brand-teal) 65%, var(--primary)))',
  teal: 'linear-gradient(90deg, var(--brand-teal), var(--primary))',
  hearth: 'linear-gradient(90deg, var(--brand-secondary), color-mix(in oklab, var(--brand-teal) 55%, var(--brand-secondary)))',
};

const audienceAccents: BrandAccent[] = ['indigo', 'teal', 'hearth', 'indigo'];

const useCaseAccents: BrandAccent[] = ['indigo', 'teal', 'hearth', 'indigo', 'teal', 'hearth'];

const valuePropAccents: Record<ValuePropKey, BrandAccent> = {
  scale: 'indigo',
  integration: 'teal',
  security: 'hearth',
};

const featureConfig: {
  key: FeatureKey;
  icon: LucideIcon;
  glow: 'blue' | 'orange' | 'green';
  accent: BrandAccent;
}[] = [
  { key: 'hybrid', icon: WifiOff, glow: 'blue', accent: 'indigo' },
  { key: 'access', icon: KeyRound, glow: 'orange', accent: 'hearth' },
  { key: 'protocols', icon: Radio, glow: 'green', accent: 'teal' },
  { key: 'multisite', icon: Building2, glow: 'blue', accent: 'indigo' },
  { key: 'realtime', icon: Zap, glow: 'orange', accent: 'hearth' },
  { key: 'ai', icon: Bot, glow: 'green', accent: 'teal' },
];

const audienceConfig: { key: AudienceKey; icon: LucideIcon }[] = [
  { key: 'home', icon: Home },
  { key: 'office', icon: Briefcase },
  { key: 'retail', icon: Store },
  { key: 'warehouse', icon: Warehouse },
];

const architectureConfig: {
  key: ArchitectureKey;
  icon: LucideIcon;
  accent: BrandAccent;
}[] = [
  { key: 'cloud', icon: Cloud, accent: 'indigo' },
  { key: 'edge', icon: Server, accent: 'teal' },
  { key: 'client', icon: Monitor, accent: 'hearth' },
];

const useCaseConfig: { key: UseCaseKey; icon: LucideIcon }[] = [
  { key: 'onboard', icon: UserPlus },
  { key: 'floorplan', icon: Map },
  { key: 'offline', icon: WifiOff },
  { key: 'sync', icon: RefreshCw },
  { key: 'ai', icon: Sparkles },
  { key: 'multisite', icon: Layers },
];

const valuePropKeys: ValuePropKey[] = ['scale', 'integration', 'security'];

const problemMarketKeys = ['cloud', 'diy', 'scada'] as const;
const problemSolutionKeys = ['hybrid', 'access', 'protocols'] as const;

function SectionAccentBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-0.5 w-9 rounded-full bg-gradient-to-r from-primary via-[var(--brand-teal)] to-[var(--brand-secondary)]/70',
        className,
      )}
      aria-hidden
    />
  );
}

function AccentCard({
  accent,
  className,
  children,
  ...props
}: ComponentProps<typeof Card> & { accent?: BrandAccent }) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden landing-card-surface',
        accent && 'landing-card-accent-top',
        className,
      )}
      style={
        accent
          ? ({ '--landing-accent-line': accentTopLine[accent] } as CSSProperties)
          : undefined
      }
      {...props}
    >
      {children}
    </Card>
  );
}

export default function LandingPage() {
  const { t, ready } = useTranslation();
  const pageRef = useRef<HTMLDivElement>(null);

  useLandingGsap(pageRef, ready);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <ThemeInitializer />
      <div ref={pageRef} className="min-h-screen bg-background text-foreground">
        <AuroraBackground className="w-full">
          <section className="relative w-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-background" />
            <div className="container relative z-10 py-2 lg:py-4">
              <div className="max-w-3xl -translate-y-14 space-y-6">
                <span
                  data-hero-item
                  className="landing-eyebrow inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
                >
                  {t('landing.hero.badge')}
                </span>
                <h1
                  data-hero-item
                  className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl"
                >
                  <span className="text-foreground">{t('landing.hero.titleBefore')}</span>
                  <span className="landing-gradient-text">{t('landing.hero.titleHighlight')}</span>
                  <span className="text-foreground">{t('landing.hero.titleAfter')}</span>
                </h1>
                <p data-hero-item className="text-base text-muted-foreground md:text-lg">
                  {t('landing.hero.description')}
                </p>
                <div data-hero-item className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="shadow-md shadow-primary/15">
                    <Link href="/dashboard">{t('landing.hero.ctaDashboard')}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="border-primary/15 bg-primary/[0.06] hover:bg-primary/10"
                  >
                    <Link href="/admin">{t('landing.hero.ctaAdmin')}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </AuroraBackground>

        <section
          id="why"
          data-landing-section
          className="landing-mesh-indigo scroll-mt-20 border-y border-primary/10 py-20"
        >
          <div className="container space-y-10">
            <div data-section-header className="max-w-2xl space-y-3">
              <SectionAccentBar />
              <h2 className="text-3xl font-semibold">{t('landing.problem.title')}</h2>
              <p className="text-muted-foreground">{t('landing.problem.description')}</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                data-problem-card
                className="landing-card-surface border-border/80 bg-card/95"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{t('landing.problem.marketTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {problemMarketKeys.map((key) => (
                      <li key={key} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        {t(`landing.problem.marketItems.${key}`)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card data-problem-card className="landing-card-solution">
                <CardHeader>
                  <CardTitle className="text-lg landing-gradient-text">
                    {t('landing.problem.solutionTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {problemSolutionKeys.map((key) => (
                      <li key={key} className="flex gap-3 text-sm text-foreground/90">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-teal)]" />
                        {t(`landing.problem.solutionItems.${key}`)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" data-landing-section className="scroll-mt-20 py-20">
          <div className="container space-y-10">
            <div data-section-header className="max-w-2xl space-y-3">
              <SectionAccentBar />
              <h2 className="text-3xl font-semibold">{t('landing.features.title')}</h2>
              <p className="text-muted-foreground">{t('landing.features.description')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureConfig.map(({ key, icon: Icon, glow, accent }) => (
                <div key={key} data-reveal data-reveal-hover className="h-full">
                  <GlowCard
                    customSize
                    glowColor={glow}
                    className="h-full w-full border border-primary/10 bg-card/85 p-6"
                  >
                    <div className="space-y-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          accentIconClass[accent],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">
                        {t(`landing.features.items.${key}.title`)}
                      </CardTitle>
                      <CardDescription>
                        {t(`landing.features.items.${key}.description`)}
                      </CardDescription>
                    </div>
                  </GlowCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="audiences"
          data-landing-section
          className="landing-mesh-teal scroll-mt-20 border-y border-[var(--brand-teal)]/10 py-20"
        >
          <div className="container space-y-10">
            <div data-section-header className="max-w-2xl space-y-3">
              <SectionAccentBar />
              <h2 className="text-3xl font-semibold">{t('landing.audiences.title')}</h2>
              <p className="text-muted-foreground">{t('landing.audiences.description')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {audienceConfig.map(({ key, icon: Icon }, index) => {
                const accent = audienceAccents[index % audienceAccents.length]!;
                return (
                  <AccentCard
                    key={key}
                    accent={accent}
                    data-reveal
                    data-reveal-hover
                  >
                    <CardContent className="space-y-3 p-6">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          accentIconClass[accent],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold">{t(`landing.audiences.items.${key}.title`)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`landing.audiences.items.${key}.description`)}
                      </p>
                    </CardContent>
                  </AccentCard>
                );
              })}
            </div>
          </div>
        </section>

        <section id="architecture" data-landing-section className="scroll-mt-20 py-20">
          <div className="container space-y-10">
            <div data-section-header className="max-w-2xl space-y-3">
              <SectionAccentBar />
              <h2 className="text-3xl font-semibold">{t('landing.architecture.title')}</h2>
              <p className="text-muted-foreground">{t('landing.architecture.description')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {architectureConfig.map(({ key, icon: Icon, accent }, index) => (
                <div key={key} className="relative">
                  {index < architectureConfig.length - 1 && (
                    <div
                      className="landing-arch-connector absolute top-1/2 -right-3 hidden h-px w-6 -translate-y-1/2 md:block"
                      aria-hidden
                    />
                  )}
                  <AccentCard data-arch-card accent={accent} className="h-full">
                    <CardContent className="space-y-4 p-6">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          accentIconClass[accent],
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-lg font-semibold">
                        {t(`landing.architecture.layers.${key}.title`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(`landing.architecture.layers.${key}.description`)}
                      </p>
                    </CardContent>
                  </AccentCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="use-cases"
          data-landing-section
          className="landing-mesh-hearth scroll-mt-20 border-y border-[var(--brand-secondary)]/10 py-20"
        >
          <div className="container space-y-10">
            <div data-section-header className="max-w-2xl space-y-3">
              <SectionAccentBar />
              <h2 className="text-3xl font-semibold">{t('landing.useCases.title')}</h2>
              <p className="text-muted-foreground">{t('landing.useCases.description')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCaseConfig.map(({ key, icon: Icon }, index) => {
                const accent = useCaseAccents[index % useCaseAccents.length]!;
                return (
                  <AccentCard
                    key={key}
                    accent={accent}
                    data-reveal
                    data-reveal-hover
                    className="transition-colors hover:border-primary/25"
                  >
                    <CardContent className="flex gap-4 p-5">
                      <span className="landing-use-case-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              accent === 'indigo' && 'text-primary',
                              accent === 'teal' && 'text-[var(--brand-teal)]',
                              accent === 'hearth' && 'text-[var(--brand-secondary)]',
                            )}
                          />
                          <p className="text-sm font-semibold">
                            {t(`landing.useCases.items.${key}.title`)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t(`landing.useCases.items.${key}.description`)}
                        </p>
                      </div>
                    </CardContent>
                  </AccentCard>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="value-props"
          data-landing-section
          className="landing-mesh-indigo scroll-mt-20 py-20"
        >
          <div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div data-section-header className="space-y-4">
                <SectionAccentBar />
                <h2 className="text-3xl font-semibold">{t('landing.valueProps.title')}</h2>
                <p className="text-muted-foreground">{t('landing.valueProps.description')}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {valuePropKeys.map((key) => (
                  <AccentCard
                    key={key}
                    accent={valuePropAccents[key]}
                    data-reveal
                    data-reveal-hover
                  >
                    <CardContent className="space-y-2 p-5">
                      <p className="text-sm font-semibold">
                        {t(`landing.valueProps.items.${key}.title`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(`landing.valueProps.items.${key}.description`)}
                      </p>
                    </CardContent>
                  </AccentCard>
                ))}
              </div>
            </div>
            <div data-stats-panel className="landing-stats-panel rounded-3xl p-8">
              <div className="space-y-4">
                <div data-stat-row className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('landing.stats.statusLabel')}</span>
                  <span className="font-medium text-primary">{t('landing.stats.statusValue')}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/80">
                  <div
                    data-landing-progress
                    className="landing-progress-fill h-2 w-full rounded-full"
                  />
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.activeDevicesLabel')}</span>
                    <span className="shrink-0 font-medium text-[var(--brand-teal)]">
                      {t('landing.stats.activeDevicesValue')}
                    </span>
                  </div>
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.responseTimeLabel')}</span>
                    <span className="shrink-0 font-medium text-foreground">
                      {t('landing.stats.responseTimeValue')}
                    </span>
                  </div>
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.automationLabel')}</span>
                    <span className="shrink-0 text-right font-medium text-[var(--brand-secondary)]">
                      {t('landing.stats.automationValue')}
                    </span>
                  </div>
                </div>
                <Button data-reveal asChild className="w-full shadow-md shadow-primary/20" size="lg">
                  <Link href="/dashboard">{t('landing.stats.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
