import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Analytics from '@/components/Analytics';
import ErrorBoundary from '@/components/ErrorBoundary';
import I18nProvider from '@/components/I18nProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jsonformatter.me'),
  title: {
    default: 'JSON Formatter - Format, Validate & View JSON Online',
    template: '%s | JSON Formatter'
  },
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE', // Add your Google verification code
  },
  description: 'JSON Formatter and JSON Viewer online. Format JSON, validate JSON syntax, and view JSON in a tree structure. Free JSON beautifier with syntax highlighting.',
  keywords: 'json formatter, json viewer, json validator, json beautifier, format json, json online, json editor, json parser, json lint',
  authors: [{ name: 'Andres Duque' }],
  openGraph: {
    title: 'JSON Formatter - Format & View JSON Online',
    description: 'JSON Formatter and JSON Viewer. Format JSON, validate syntax, view as tree. Free online tool.',
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
    title: 'JSON Formatter - Format & View JSON Online',
    description: 'JSON Formatter and JSON Viewer. Format JSON, validate syntax, view as tree.',
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
  // Multiple structured data schemas for better SEO
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://jsonformatter.me/#webapp',
    name: 'JSON Formatter',
    alternateName: ['JSON Viewer', 'JSON Validator', 'JSON Beautifier', 'JSON Editor'],
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Web Development Tool',
    description: 'Free online JSON formatter, viewer, and validator. Format, beautify, validate, and view JSON data instantly with syntax highlighting, tree view, and auto-fix capabilities.',
    url: 'https://jsonformatter.me/',
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
    screenshot: 'https://jsonformatter.me/img/screenshot.png',
    browserRequirements: 'Requires JavaScript. Works on Chrome, Firefox, Safari, Edge.',
    softwareVersion: '2.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: 'en',
    isAccessibleForFree: true,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '3250',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: 'Andres Duque',
      url: 'https://github.com/aduquehd',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://jsonformatter.me/#website',
    name: 'jsonformatter.me',
    alternateName: 'JSON Formatter Online',
    url: 'https://jsonformatter.me/',
    description: 'Free online JSON formatter, viewer, and validator for developers',
    publisher: {
      '@type': 'Person',
      name: 'Andres Duque',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://jsonformatter.me/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://jsonformatter.me/#faq',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a JSON formatter?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A JSON formatter is a tool that takes raw JSON data and formats it with proper indentation and line breaks, making it easier to read and understand. Our JSON formatter automatically adds 2-space indentation, organizes nested objects and arrays, and highlights syntax for better visibility.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I format JSON online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To format JSON online: 1) Paste your JSON into the editor, 2) Click the "Format" button, 3) Your JSON will be instantly formatted with proper indentation. You can also use Ctrl+V to paste and the formatter will automatically beautify valid JSON.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is this JSON formatter free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, jsonformatter.me is completely free to use with no limitations. There are no signup requirements, no ads, and no data limits. You can format, validate, and view as much JSON as you need.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my JSON data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, your JSON data is 100% secure. All processing happens directly in your browser - no data is ever sent to our servers. Your JSON never leaves your computer, making it safe for sensitive data.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between JSON formatter and JSON viewer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A JSON formatter beautifies JSON text with proper indentation, while a JSON viewer provides an interactive way to explore JSON data through tree views, graphs, or other visualizations. Our tool includes both - you can format JSON in the editor and explore it in the Tree View tab.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can this tool fix invalid JSON?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our JSON formatter includes an intelligent auto-fix feature that can correct common JSON errors like trailing commas, single quotes instead of double quotes, unquoted keys, and missing commas. It will show you what was fixed automatically.',
        },
      },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://jsonformatter.me/',
      },
    ],
  };

  const jsonLdSchemas = [webApplicationSchema, websiteSchema, faqSchema, breadcrumbSchema];

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
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