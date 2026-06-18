import { NextResponse } from 'next/server';
import { seoViews } from '@/lib/tools';

export async function GET() {
  const baseUrl = 'https://www.jsonformatter.me';
  const lastModified = new Date().toISOString().split('T')[0];

  const urlEntry = (
    path: string,
    { changefreq = 'weekly', priority = '0.7' }: { changefreq?: string; priority?: string } = {}
  ) =>
    `  <url>
    <loc>${baseUrl}${path === '/' ? '/' : path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  // View routes are derived from the shared config so the sitemap can never
  // drift from the pages that actually exist. The home/editor view is the
  // top-priority entry.
  const viewUrls = seoViews.map((v) =>
    urlEntry(v.path, { changefreq: 'weekly', priority: v.path === '/' ? '1.0' : '0.9' })
  );

  const staticUrls = [
    urlEntry('/help', { changefreq: 'monthly', priority: '0.8' }),
    urlEntry('/guides', { changefreq: 'weekly', priority: '0.7' }),
    urlEntry('/guides/what-is-json', { changefreq: 'monthly', priority: '0.7' }),
    urlEntry('/guides/json-syntax', { changefreq: 'monthly', priority: '0.7' }),
    urlEntry('/guides/common-json-errors', { changefreq: 'monthly', priority: '0.7' }),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...viewUrls, ...staticUrls].join('\n')}
</urlset>`;

  return new NextResponse(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
