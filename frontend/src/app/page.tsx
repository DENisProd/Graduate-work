'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/spotlight-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeInitializer } from '@/components/shared';
import { useTranslation } from '@/hooks';

export default function LandingPage() {
  const { t, ready } = useTranslation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const featureList = [
    {
      title: t('landing.features.items.unified.title'),
      description: t('landing.features.items.unified.description'),
    },
    {
      title: t('landing.features.items.access.title'),
      description: t('landing.features.items.access.description'),
    },
    {
      title: t('landing.features.items.analytics.title'),
      description: t('landing.features.items.analytics.description'),
    },
  ];

  const featureGlowColors = ['blue', 'orange', 'green'] as const;

  const valueProps = [
    {
      title: t('landing.valueProps.items.scale.title'),
      description: t('landing.valueProps.items.scale.description'),
    },
    {
      title: t('landing.valueProps.items.integration.title'),
      description: t('landing.valueProps.items.integration.description'),
    },
    {
      title: t('landing.valueProps.items.security.title'),
      description: t('landing.valueProps.items.security.description'),
    },
  ];

  return (
    <>
      <ThemeInitializer />
      <div className="min-h-screen bg-background text-foreground">
        <AuroraBackground className="w-full">
          <section className="relative w-full overflow-hidden">
            <div className="container relative z-10 py-2 lg:py-4">
              <div className="max-w-3xl -translate-y-14 space-y-6">
                <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t('landing.hero.badge')}
                </span>
                <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl lg:text-6xl">
                  {t('landing.hero.title')}
                </h1>
                <p className="text-base text-muted-foreground md:text-lg">
                  {t('landing.hero.description')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/dashboard">{t('landing.hero.ctaDashboard')}</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/admin">{t('landing.hero.ctaAdmin')}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </AuroraBackground>

        <section className="py-20">
          <div className="container space-y-10">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold">{t('landing.features.title')}</h2>
              <p className="text-muted-foreground">{t('landing.features.description')}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featureList.map((feature, index) => (
                <GlowCard
                  key={feature.title}
                  customSize
                  glowColor={featureGlowColors[index % featureGlowColors.length]}
                  className="h-full w-full border border-border bg-card/80 p-6"
                >
                  <div className="space-y-3">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold">{t('landing.valueProps.title')}</h2>
              <p className="text-muted-foreground">{t('landing.valueProps.description')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {valueProps.map((item) => (
                  <Card key={item.title} className="border border-border bg-card/90">
                    <CardContent className="space-y-2 p-5">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card/70 p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('landing.stats.statusLabel')}</span>
                  <span className="font-medium text-primary">{t('landing.stats.statusValue')}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-4/5 rounded-full bg-primary" />
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('landing.stats.activeDevicesLabel')}</span>
                    <span className="font-medium text-foreground">
                      {t('landing.stats.activeDevicesValue')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('landing.stats.responseTimeLabel')}</span>
                    <span className="font-medium text-foreground">
                      {t('landing.stats.responseTimeValue')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('landing.stats.automationLabel')}</span>
                    <span className="font-medium text-foreground">
                      {t('landing.stats.automationValue')}
                    </span>
                  </div>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href="/dashboard">{t('landing.stats.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer7 />
      </div>
    </>
  );
}
