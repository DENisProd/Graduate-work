import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Включаем строгий режим React
  reactStrictMode: true,

  // Оптимизация пакетов HeroUI
  transpilePackages: ['@heroui/react', '@heroui/styles'],

  // Экспериментальные настройки
  experimental: {
    // Оптимизация импортов
    optimizePackageImports: ['@heroui/react', 'framer-motion'],
  },
};

export default nextConfig;
