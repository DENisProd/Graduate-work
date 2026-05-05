import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Включаем строгий режим React
  reactStrictMode: true,

  // Экспериментальные настройки
  experimental: {
    // Оптимизация импортов
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
