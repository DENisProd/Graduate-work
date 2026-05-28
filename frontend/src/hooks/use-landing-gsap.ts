'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useLandingGsap(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !containerRef.current || prefersReducedMotion()) {
      return;
    }

    const root = containerRef.current;

    const hoverCleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>('[data-hero-item]', root);
      if (heroItems.length) {
        gsap.set(heroItems, { opacity: 0, y: 32 });
        gsap.to(heroItems, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.15,
        });
      }

      const sections = gsap.utils.toArray<HTMLElement>('[data-landing-section]', root);
      sections.forEach((section) => {
        const header = section.querySelector<HTMLElement>('[data-section-header]');
        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', section);

        if (header) {
          gsap.set(header, { opacity: 0, y: 40 });
          gsap.to(header, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          });
        }

        if (reveals.length) {
          gsap.set(reveals, { opacity: 0, y: 48 });
          gsap.to(reveals, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: 'top 78%',
              toggleActions: 'play none none reverse',
            },
          });
        }
      });

      const problemCards = gsap.utils.toArray<HTMLElement>('[data-problem-card]', root);
      problemCards.forEach((card, index) => {
        gsap.set(card, { opacity: 0, x: index === 0 ? -48 : 48 });
        gsap.to(card, {
          opacity: 1,
          x: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      const archCards = gsap.utils.toArray<HTMLElement>('[data-arch-card]', root);
      archCards.forEach((card, index) => {
        gsap.set(card, { opacity: 0, y: 56, scale: 0.94 });
        gsap.to(card, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.12,
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      const statsPanel = root.querySelector<HTMLElement>('[data-stats-panel]');
      if (statsPanel) {
        gsap.set(statsPanel, { opacity: 0, x: 56, scale: 0.96 });
        gsap.to(statsPanel, {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statsPanel,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      const progressBar = root.querySelector<HTMLElement>('[data-landing-progress]');
      if (progressBar) {
        gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' });
        gsap.to(progressBar, {
          scaleX: 0.8,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: progressBar,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      const statRows = gsap.utils.toArray<HTMLElement>('[data-stat-row]', root);
      if (statRows.length) {
        gsap.set(statRows, { opacity: 0, x: 16 });
        gsap.to(statRows, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: statsPanel ?? statRows[0],
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal-hover]', root).forEach((el) => {
        const onEnter = () => {
          gsap.to(el, { y: -6, duration: 0.35, ease: 'power2.out' });
        };
        const onLeave = () => {
          gsap.to(el, { y: 0, duration: 0.4, ease: 'power2.out' });
        };
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        hoverCleanups.push(() => {
          el.removeEventListener('mouseenter', onEnter);
          el.removeEventListener('mouseleave', onLeave);
        });
      });
    }, root);

    return () => {
      hoverCleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [containerRef, enabled]);
}
