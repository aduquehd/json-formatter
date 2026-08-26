/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy applied in production only (dev needs 'unsafe-eval' +
// websockets for HMR, which we don't want to bless permanently).
//
// 'unsafe-inline' covers Next's inline bootstrap/hydration scripts and the
// JSON-LD blocks, and is the one remaining relaxation. Removing it needs a
// nonce, which needs middleware, which would make these statically prerendered
// pages dynamic — a deliberate trade left for its own change.
//
// Everything else is named explicitly. Deliberately absent:
//   - 'unsafe-eval'          only Monaco's AMD loader ever needed it.
//   - Google Fonts hosts     next/font/google self-hosts at build time.
//   - a nonce               see above; 'unsafe-inline' is the standing trade.
//   - img-src https:         a blanket allowance that let any host serve images;
//                            the two map tile providers are named instead.
//   - *.tile.openstreetmap   no map style has pointed there for some time.
//
// va.vercel-scripts.com is the analytics script's off-Vercel fallback; on a
// Vercel deployment the same-origin path is used, but naming it keeps analytics
// working if that ever changes.
const TILE_HOSTS = 'https://*.basemaps.cartocdn.com https://server.arcgisonline.com';
const ANALYTICS_HOST = 'https://va.vercel-scripts.com';
// GA4 loads from googletagmanager and beacons to google-analytics. Wildcards
// follow Google's own CSP guidance: EU traffic is routed to regional endpoints
// (region1.analytics.google.com etc.) that the bare domains would block.
const GA_SCRIPT_HOST = 'https://*.googletagmanager.com';
const GA_BEACON_HOSTS =
  'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${ANALYTICS_HOST} ${GA_SCRIPT_HOST}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${TILE_HOSTS} ${GA_BEACON_HOSTS}`,
  `connect-src 'self' ${ANALYTICS_HOST} ${GA_BEACON_HOSTS}`,
  "worker-src 'self' blob:",
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
