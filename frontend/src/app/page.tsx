'use client';

import { useRef, type ComponentProps, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Cloud,
  Home,
  KeyRound,
  Layers,
  Lightbulb,
  Lock,
  Map,
  Monitor,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Store,
  Thermometer,
  UserPlus,
  Warehouse,
  Wifi,
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

type TranslateFn = ReturnType<typeof useTranslation>['t'];

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

const techStack = [
  { label: 'Zigbee2MQTT', dot: 'indigo' },
  { label: 'MQTT', dot: 'indigo' },
  { label: 'Modbus RTU/TCP', dot: 'teal' },
  { label: 'PostgreSQL', dot: 'teal' },
  { label: 'MongoDB', dot: 'hearth' },
  { label: 'Keycloak', dot: 'hearth' },
  { label: 'NestJS', dot: 'indigo' },
  { label: 'Next.js', dot: 'teal' },
  { label: 'Socket.IO', dot: 'hearth' },
] as const;

const dotClass: Record<string, string> = {
  indigo: 'bg-primary',
  teal: 'bg-[var(--brand-teal)]',
  hearth: 'bg-[var(--brand-secondary)]',
};

function SectionKicker({ label, className }: { label: string; className?: string }) {
  return <p className={cn('landing-section-kicker', className)}>{label}</p>;
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

function LandingHeader({ t }: { t: TranslateFn }) {
  return (
    <header className="landing-header">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground transition-opacity group-hover:opacity-85">
            Д
          </span>
          <span className="font-semibold tracking-tight">{t('header.title')}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link href="#why" className="transition-colors hover:text-foreground">
            {t('landing.nav.why')}
          </Link>
          <Link href="#features" className="transition-colors hover:text-foreground">
            {t('landing.nav.features')}
          </Link>
          <Link href="#architecture" className="transition-colors hover:text-foreground">
            {t('landing.nav.architecture')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden text-sm sm:inline-flex">
            <Link href="/dashboard">{t('landing.nav.ctaSecondary')}</Link>
          </Button>
          <Button asChild size="sm" className="text-sm shadow-sm shadow-primary/20">
            <Link href="/dashboard">{t('landing.nav.cta')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function DeviceStatusMockup() {
  return (
    <div className="landing-hero-mockup">
      <div className="landing-hero-mockup-header">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-teal)]" />
          <span className="text-xs font-semibold text-foreground">Домовой</span>
          <span className="rounded-full border border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-teal)]">
            Online
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">3 объекта</span>
      </div>

      <div className="space-y-2 p-3">
        <div className="landing-hero-mockup-row">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
            <span className="text-xs text-foreground/80">Свет в гостиной</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary)]" />
            <span className="text-xs font-medium text-[var(--brand-secondary)]">Вкл</span>
          </div>
        </div>

        <div className="landing-hero-mockup-row">
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-foreground/80">Климат</span>
          </div>
          <span className="text-xs font-semibold text-primary">21 °C</span>
        </div>

        <div className="landing-hero-mockup-row">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
            <span className="text-xs text-foreground/80">Входная дверь</span>
          </div>
          <span className="text-xs font-medium text-[var(--brand-teal)]">Заперта</span>
        </div>

        <div className="landing-hero-mockup-row">
          <div className="flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Zigbee-сеть</span>
          </div>
          <span className="text-[11px] text-muted-foreground">12 устройств</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--border)]/40 px-3 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Автоматизации</span>
          <span className="font-medium text-[var(--brand-secondary)]">4 активных</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary via-[var(--brand-teal)] to-[var(--brand-secondary)]" />
        </div>
      </div>

      <div className="landing-hero-mockup-footer">
        <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Обновлено 3с назад</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] font-medium text-[var(--brand-teal)]">Локальный сервер</span>
      </div>
    </div>
  );
}

function LandingCTA({ t }: { t: TranslateFn }) {
  return (
    <section className="landing-cta-section">
      <div className="container">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.cta.title')}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t('landing.cta.description')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="shadow-md shadow-primary/20">
              <Link href="/dashboard">
                {t('landing.cta.primary')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary/20 bg-primary/[0.04] hover:bg-primary/8"
            >
              <Link href="/admin">{t('landing.cta.secondary')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
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
            <div className="container relative z-10 pb-20 pt-12 lg:pb-64 lg:pt-50">
              <div className="grid items-center gap-12 lg:grid-cols-[1fr_400px]">
                <div className="max-w-2xl space-y-7">
                  <h1
                    data-hero-item
                    className="text-5xl font-bold leading-[1.07] tracking-tight sm:text-6xl lg:text-7xl"
                  >
                    <span className="text-foreground">{t('landing.hero.titleBefore')}</span>
                    <span className="landing-gradient-text">{t('landing.hero.titleHighlight')}</span>
                    <span className="text-foreground">{t('landing.hero.titleAfter')}</span>
                  </h1>
                  <p
                    data-hero-item
                    className="max-w-xl text-base text-muted-foreground md:text-lg"
                  >
                    {t('landing.hero.description')}
                  </p>
                  <div data-hero-item className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="shadow-md shadow-primary/20">
                      <Link href="/dashboard">
                        {t('landing.hero.ctaDashboard')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
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

                <div data-hero-item className="flex justify-center lg:justify-end">
                  <DeviceStatusMockup />
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
              <SectionKicker label={t('landing.nav.why')} />
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing.problem.title')}
              </h2>
              <p className="text-muted-foreground">{t('landing.problem.description')}</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                data-problem-card
                className="landing-card-surface border-border/80 bg-card/95"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    {t('landing.problem.marketTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3.5">
                    {problemMarketKeys.map((key) => (
                      <li key={key} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        {t(`landing.problem.marketItems.${key}`)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card data-problem-card className="landing-card-solution">
                <CardHeader className="pb-3">
                  <CardTitle className="landing-gradient-text text-base font-semibold">
                    {t('landing.problem.solutionTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3.5">
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
              <SectionKicker label={t('landing.nav.features')} />
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing.features.title')}
              </h2>
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
                      <CardTitle className="text-base font-semibold">
                        {t(`landing.features.items.${key}.title`)}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
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
              <SectionKicker label={t('landing.nav.features')} />
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing.audiences.title')}
              </h2>
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
                      <p className="text-sm font-semibold">
                        {t(`landing.audiences.items.${key}.title`)}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
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
              <SectionKicker label={t('landing.nav.architecture')} />
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing.architecture.title')}
              </h2>
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
                      <p className="font-semibold">
                        {t(`landing.architecture.layers.${key}.title`)}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
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
              <SectionKicker label={t('landing.nav.features')} />
              <h2 className="text-3xl font-bold tracking-tight">
                {t('landing.useCases.title')}
              </h2>
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
                      <span className="landing-use-case-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              'h-3.5 w-3.5 shrink-0',
                              accent === 'indigo' && 'text-primary',
                              accent === 'teal' && 'text-[var(--brand-teal)]',
                              accent === 'hearth' && 'text-[var(--brand-secondary)]',
                            )}
                          />
                          <p className="text-sm font-semibold">
                            {t(`landing.useCases.items.${key}.title`)}
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
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
          <div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div data-section-header className="space-y-4">
                <SectionKicker label={t('landing.nav.why')} />
                <h2 className="text-3xl font-bold tracking-tight">
                  {t('landing.valueProps.title')}
                </h2>
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
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(`landing.valueProps.items.${key}.description`)}
                      </p>
                    </CardContent>
                  </AccentCard>
                ))}
              </div>
            </div>
            <div data-stats-panel className="landing-stats-panel rounded-2xl p-8">
              <div className="space-y-5">
                <div data-stat-row className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('landing.stats.statusLabel')}</span>
                  <span className="font-medium text-primary">{t('landing.stats.statusValue')}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
                  <div
                    data-landing-progress
                    className="landing-progress-fill h-1.5 w-full rounded-full"
                  />
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.activeDevicesLabel')}</span>
                    <span className="shrink-0 font-semibold text-[var(--brand-teal)]">
                      {t('landing.stats.activeDevicesValue')}
                    </span>
                  </div>
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.responseTimeLabel')}</span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {t('landing.stats.responseTimeValue')}
                    </span>
                  </div>
                  <div data-stat-row className="flex items-center justify-between gap-4">
                    <span>{t('landing.stats.automationLabel')}</span>
                    <span className="shrink-0 text-right font-semibold text-[var(--brand-secondary)]">
                      {t('landing.stats.automationValue')}
                    </span>
                  </div>
                </div>
                <Button data-reveal asChild className="w-full shadow-md shadow-primary/20" size="lg">
                  <Link href="/dashboard">
                    {t('landing.stats.cta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <LandingCTA t={t} />
      </div>
    </>
  );
}
