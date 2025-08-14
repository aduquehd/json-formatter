import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

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
  title: 'JSON Formatter & Viewer - Free Online JSON Validator and Beautifier',
  description: 'Free online JSON Formatter and JSON Viewer tool. Instantly format, validate, beautify and view JSON data. Features syntax highlighting, tree view, real-time validation, and Monaco editor. No ads, no registration required.',
  keywords: 'json formatter, json viewer, online json formatter, online json viewer, json beautifier, json validator, json pretty print, json editor online, format json online, view json online, json parser, json syntax highlighter, json tree view, json visualization, json formatting tool, best json formatter',
  authors: [{ name: 'Andres Duque' }],
  openGraph: {
    title: 'JSON Formatter & JSON Viewer - Free Online Tool',
    description: 'Best free online JSON formatter and JSON viewer. Format, validate, and view JSON data with syntax highlighting and tree view visualization.',
    type: 'website',
    siteName: 'JSON Formatter & Viewer',
    images: ['/img/optimized-size-logo.png'],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter & JSON Viewer - Free Online Tool',
    description: 'Best free online JSON formatter and JSON viewer. Format, validate, and view JSON data with syntax highlighting.',
    creator: '@aduquehd',
    images: ['/img/optimized-size-logo.png'],
  },
  robots: 'index, follow',
  icons: {
    icon: '/img/logo-favicon.png',
    apple: '/img/optimized-size-logo.png',
  },
  alternates: {
    canonical: 'https://jsonviewer.me/',
    languages: {
      'en': 'https://jsonviewer.me/',
      'x-default': 'https://jsonviewer.me/',
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
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
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