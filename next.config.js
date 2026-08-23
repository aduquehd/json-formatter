/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy applied in production only (dev needs 'unsafe-eval' +
// websockets for HMR, which we don't want to bless permanently).
// 'unsafe-inline' covers Next's inline bootstrap/hydration scripts and the
// JSON-LD blocks. 'unsafe-eval' was only needed by Monaco's AMD loader, which is
// gone — the allowance below is now unused and is slated for removal in the
// CSP-tightening pass, along with a move to a nonce-based policy via middleware.
// GA4 (gtag) loads from googletagmanager.com and posts collect beacons to
// google-analytics.com / analytics.google.com. Wildcard subdomains follow
// Google's official CSP guidance: EU traffic is routed to regional endpoints
// (e.g. region1.analytics.google.com), which the bare domains would block.
// www.google.com covers the consent-mode dual-collect fallback.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.tile.openstreetmap.org",
  "worker-src 'self' blob: data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // X-XSS-Protection is deprecated and can introduce bugs; 0 disables the legacy
  // auditor. Protection comes from the Content-Security-Policy instead.
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  ...(isProd
    ? [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Overridable so e2e builds (.next-e2e, see playwright.config.ts) don't
  // clobber the .next directory a running `pnpm dev` depends on.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Stable in Next.js 16 — auto-memoizes components (needs babel-plugin-react-compiler).
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/(.*).(js|css|map|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    // Views now live at clean paths (/, /tree, /diff, …). The editor view is the
    // home page, so the formatter/validator/beautifier/editor/parser keyword
    // URLs all consolidate there; viewer → /tree; diff/comparison → /diff.
    const toEditor = [
      'json-formatter',
      'json-validator',
      'json-beautifier',
      'json-editor',
      'json-parser',
    ];

    return [
      // Legacy bare + /tools/* keyword URLs → editor (home).
      ...toEditor.flatMap((slug) => [
        { source: `/${slug}`, destination: '/', permanent: true },
        { source: `/tools/${slug}`, destination: '/', permanent: true },
      ]),
      // Viewer → tree view.
      { source: '/json-viewer', destination: '/tree', permanent: true },
      { source: '/tools/json-viewer', destination: '/tree', permanent: true },
      // Diff / comparison → diff view.
      { source: '/json-diff', destination: '/diff', permanent: true },
      { source: '/json-comparison', destination: '/diff', permanent: true },
      { source: '/compare', destination: '/diff', permanent: true },
      { source: '/tools/json-diff', destination: '/diff', permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
  // Next.js 16 defaults to Turbopack for `next dev` and `next build`.
  // Keep this block empty-but-present only if we need Turbopack options later.
  turbopack: {},
};

module.exports = nextConfig;
