import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Allow the S3/MinIO origin for presigned PUT (upload) + GET (admin thumbnails).
// In prod this is R2 (https, already covered); in dev it's http://localhost:9000.
let s3Origin = '';
try {
  s3Origin = new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000').origin;
} catch {
  s3Origin = 'http://localhost:9000';
}

// CSP: self + inline styles (Tailwind/maplibre), OSM raster tiles, presigned S3
// GETs (blob/data + any https for MinIO/R2), and connect for the SSE interview.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org https: ${s3Origin}`,
  "font-src 'self' data:",
  `connect-src 'self' https://tile.openstreetmap.org https: ${s3Origin}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: csp },
];

const allowedOrigins = (process.env.SERVER_ACTION_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Trace files from the monorepo root so the standalone bundle includes workspace pkgs.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  transpilePackages: ['@dayak/db', '@dayak/i18n', '@dayak/ai', '@dayak/notifications'],
  // Prisma + argon2 are native; keep them external to the server bundle.
  serverExternalPackages: ['@prisma/client', '@node-rs/argon2', '@anthropic-ai/sdk'],
  experimental: {
    // CSRF: restrict which origins may invoke Server Actions (spec 11.7).
    // Add your production host(s) via SERVER_ACTION_ORIGINS (comma-separated).
    ...(allowedOrigins.length ? { serverActions: { allowedOrigins } } : {}),
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
