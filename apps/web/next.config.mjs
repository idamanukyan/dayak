import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dayak/db', '@dayak/i18n'],
  experimental: {
    // Prisma + argon2 are native; keep them external to the server bundle.
    serverComponentsExternalPackages: ['@prisma/client', '@node-rs/argon2'],
  },
};

export default withNextIntl(nextConfig);
