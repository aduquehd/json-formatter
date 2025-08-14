import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import Hotjar from '@/components/Hotjar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'JSON Formatter & Viewer - Free Online JSON Validator, Beautifier & Editor',
  description: 'Best free online JSON formatter, JSON viewer, and JSON validator. Format JSON, beautify JSON, validate JSON, and view JSON online instantly. Features include JSON editor, JSON parser, JSON tree view, syntax highlighting, JSON pretty print, and real-time JSON validation. No ads, no signup required.',
  keywords: 'json formatter, json viewer, online json formatter, online json viewer, json beautifier, json validator, json pretty print, json editor online, format json online, view json online, json parser, json syntax highlighter, json tree view, json visualization, json formatting tool, best json formatter, free json formatter, json lint, jsonlint, json online, json format online, beautify json, validate json, json editor, json prettify, json minify, json compact, json fix, json fixer, json tool, json tools online, json formatter online free, json viewer online free, json beautifier online, json validator online, json pretty print online',
  authors: [{ name: 'Andres Duque' }],
  openGraph: {
    title: 'JSON Formatter & JSON Viewer - Free Online JSON Tools',
    description: 'Best free online JSON formatter, JSON viewer, and JSON validator. Format JSON, beautify JSON, validate JSON instantly with syntax highlighting, tree view, and Monaco editor. No ads, completely free.',
    type: 'website',
    siteName: 'JSON Formatter & Viewer - Online JSON Tools',
    images: ['/img/optimized-size-logo.png'],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter & JSON Viewer - Free Online JSON Tools',
    description: 'Free online JSON formatter, JSON viewer, JSON validator. Format, beautify, and validate JSON instantly. JSON editor with syntax highlighting.',
    creator: '@aduquehd',
    images: ['/img/optimized-size-logo.png'],
  },
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  icons: {
    icon: '/img/logo-favicon.png',
    apple: '/img/optimized-size-logo.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://jsonformatter.me/',
    languages: {
      'en': 'https://jsonformatter.me/',
      'x-default': 'https://jsonformatter.me/',
    }
  },
  other: {
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
    'google-site-verification': '', // Add your Google verification code if you have one
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'JSON Formatter & Viewer',
    applicationCategory: 'DeveloperApplication',
    description: 'Free online JSON formatter, JSON viewer, JSON validator, and JSON beautifier. Format, validate, beautify, and view JSON data online instantly.',
    url: 'https://jsonformatter.me/',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'JSON Formatting',
      'JSON Validation',
      'JSON Beautification',
      'JSON Tree View',
      'JSON Editor',
      'JSON Syntax Highlighting',
      'JSON Compacting',
      'JSON Parsing',
      'JSON Visualization',
      'JSON Diff Comparison',
      'JSON Statistics',
      'JSON Search',
      'JSON Charts',
    ],
    browserRequirements: 'Requires JavaScript. Works on all modern browsers.',
    softwareVersion: '2.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2450',
    },
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JSON Tools" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAnalytics />
        <Hotjar />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}