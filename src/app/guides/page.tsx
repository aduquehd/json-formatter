import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JSON Guides & Tutorials - Learn JSON Formatting, Validation & More',
  description: 'Learn everything about JSON with our comprehensive guides. JSON syntax, formatting best practices, common errors and fixes, and advanced JSON tips for developers.',
  keywords: 'json tutorial, json guide, learn json, json syntax, json best practices, json errors, json tips',
  openGraph: {
    title: 'JSON Guides & Tutorials - Learn JSON',
    description: 'Comprehensive JSON guides for developers. Learn syntax, formatting, validation, and best practices.',
    type: 'website',
    url: 'https://jsonformatter.me/guides',
  },
  alternates: {
    canonical: 'https://jsonformatter.me/guides',
  },
};

const guides = [
  {
    slug: 'what-is-json',
    title: 'What is JSON? A Complete Introduction',
    description: 'Learn what JSON is, why it\'s used, and how it works. A beginner-friendly guide to JavaScript Object Notation.',
    category: 'Basics',
  },
  {
    slug: 'json-syntax',
    title: 'JSON Syntax Guide: Rules and Examples',
    description: 'Master JSON syntax with this comprehensive guide. Learn about objects, arrays, data types, and proper formatting.',
    category: 'Basics',
  },
  {
    slug: 'common-json-errors',
    title: 'Common JSON Errors and How to Fix Them',
    description: 'Troubleshoot JSON parsing errors. Learn about trailing commas, quote issues, and other common mistakes.',
    category: 'Troubleshooting',
  },
  {
    slug: 'json-vs-xml',
    title: 'JSON vs XML: Which Should You Use?',
    description: 'Compare JSON and XML formats. Understand the pros and cons of each for different use cases.',
    category: 'Comparison',
  },
  {
    slug: 'json-in-javascript',
    title: 'Working with JSON in JavaScript',
    description: 'Learn to parse, stringify, and manipulate JSON data in JavaScript with practical examples.',
    category: 'Programming',
  },
  {
    slug: 'json-api-best-practices',
    title: 'JSON API Best Practices',
    description: 'Design better APIs with JSON. Best practices for structure, naming conventions, and error handling.',
    category: 'Best Practices',
  },
];

export default function GuidesPage() {
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
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://jsonformatter.me/guides',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="container mx-auto px-4 py-20">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)] transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-[var(--text-primary)] font-medium">Guides</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              JSON Guides & Tutorials
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Learn everything about JSON - from basic syntax to advanced techniques.
              Comprehensive guides for developers of all skill levels.
            </p>
          </header>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {guides.map((guide) => (
              <article
                key={guide.slug}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-[var(--accent-primary)] transition-colors"
              >
                <span className="inline-block px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-medium rounded-full mb-3">
                  {guide.category}
                </span>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {guide.title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {guide.description}
                </p>
                <span className="text-[var(--accent-primary)] text-sm font-medium">
                  Coming Soon
                </span>
              </article>
            ))}
          </div>

          {/* CTA Section */}
          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Ready to Format JSON?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Try our free JSON formatter, viewer, and validator.
            </p>
            <Link
              href="/"
              className="inline-block bg-[var(--accent-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Go to JSON Formatter
            </Link>
          </section>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-[var(--border-color)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-secondary)]">
            <p>&copy; {new Date().getFullYear()} jsonformatter.me - Free Online JSON Tools</p>
            <nav className="flex gap-6">
              <Link href="/" className="hover:text-[var(--accent-primary)] transition-colors">JSON Formatter</Link>
              <Link href="/help" className="hover:text-[var(--accent-primary)] transition-colors">Help</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
