import type { Metadata } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Analytics from '@/components/Analytics';
import ErrorBoundary from '@/components/ErrorBoundary';
import I18nProvider from '@/components/I18nProvider';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.jsonformatter.me'),
  title: {
    default: 'Free Online JSON Viewer & Formatter',
    template: '%s | JSON Formatter'
  },
  description: 'JSON Formatter & Viewer - Free, open-source tool to format, validate, and beautify JSON. Auto-fix errors, tree view, syntax highlighting. 100% client-side.',
  keywords: 'json formatter, json viewer, json validator, json beautifier, format json, json online, json editor, json parser, json lint',
  authors: [{ name: 'Andres Duque' }],
  openGraph: {
    title: 'Free Online JSON Viewer & Formatter',
    description: 'Free online JSON Formatter, JSON Viewer, and JSON Editor. Format, validate, beautify, and edit JSON with syntax highlighting and tree view.',
    url: 'https://www.jsonformatter.me/',
    type: 'website',
    siteName: 'JSON Formatter',
    images: [{
      url: '/img/og-image.png',
      width: 1200,
      height: 630,
      alt: 'JSON Formatter Online - Format, View, and Validate JSON'
    }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online JSON Viewer & Formatter',
    description: 'Free online JSON Formatter, JSON Viewer, and JSON Editor. Format, validate, beautify, and edit JSON.',
    creator: '@aduquehd',
    images: [{
      url: '/img/og-image.png',
      alt: 'JSON Formatter Online - Format, View, and Validate JSON'
    }],
  },
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  icons: {
    icon: '/img/logo-favicon.png',
    apple: '/img/optimized-size-logo.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.jsonformatter.me/',
    languages: {
      'en': 'https://www.jsonformatter.me/',
      'x-default': 'https://www.jsonformatter.me/',
    }
  },
  other: {
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Multiple structured data schemas for better SEO
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://www.jsonformatter.me/#webapp',
    name: 'JSON Formatter',
    alternateName: ['JSON Viewer', 'JSON Validator', 'JSON Beautifier', 'JSON Editor'],
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Web Development Tool',
    description: 'Free online JSON formatter, viewer, and validator. Format, beautify, validate, and view JSON data instantly with syntax highlighting, tree view, and auto-fix capabilities.',
    url: 'https://www.jsonformatter.me/',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'One-click JSON formatting with proper indentation',
      'Real-time JSON syntax validation',
      'Interactive tree view for JSON exploration',
      'Automatic JSON error detection and fixing',
      'JSON diff comparison between two files',
      'Monaco Editor with syntax highlighting',
      'JSON minification/compacting',
      'Copy formatted JSON to clipboard',
      'No data sent to servers - 100% client-side',
      'Works offline after first load',
    ],
    screenshot: 'https://www.jsonformatter.me/img/screenshot.png',
    browserRequirements: 'Requires JavaScript. Works on Chrome, Firefox, Safari, Edge.',
    softwareVersion: '2.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: 'Andres Duque',
      url: 'https://github.com/aduquehd',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.jsonformatter.me/#website',
    name: 'jsonformatter.me',
    alternateName: 'JSON Formatter Online',
    url: 'https://www.jsonformatter.me/',
    description: 'Free online JSON formatter, viewer, and validator for developers',
    publisher: {
      '@type': 'Person',
      name: 'Andres Duque',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.jsonformatter.me/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.jsonformatter.me/',
      },
    ],
  };

  const jsonLdSchemas = [webApplicationSchema, websiteSchema, breadcrumbSchema];

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JSON Tools" />
        <script src="/suppress-monaco-warnings.js" />
        {jsonLdSchemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${plexSans.variable} ${jetbrainsMono.variable}`}>
        <Analytics />
        <ErrorBoundary>
          <I18nProvider>
            <ThemeProvider>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              {children}
            </ThemeProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}