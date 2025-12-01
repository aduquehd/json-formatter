import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What is JSON? A Complete Guide to JavaScript Object Notation',
  description: 'Learn what JSON is, how it works, and why it\'s the most popular data format for web APIs. Includes examples, syntax rules, and common use cases.',
  keywords: 'what is json, json meaning, json definition, json tutorial, json explained, javascript object notation, json format, json data',
  openGraph: {
    title: 'What is JSON? A Complete Guide',
    description: 'Learn what JSON is, how it works, and why it\'s the most popular data format for web APIs.',
    type: 'article',
    url: 'https://jsonformatter.me/guides/what-is-json',
  },
  alternates: {
    canonical: 'https://jsonformatter.me/guides/what-is-json',
  },
};

export default function WhatIsJsonPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What is JSON? A Complete Guide to JavaScript Object Notation',
    description: 'Learn what JSON is, how it works, and why it\'s the most popular data format for web APIs.',
    author: {
      '@type': 'Person',
      name: 'Andres Duque',
    },
    publisher: {
      '@type': 'Organization',
      name: 'jsonformatter.me',
      url: 'https://jsonformatter.me',
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: 'https://jsonformatter.me/guides/what-is-json',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jsonformatter.me/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://jsonformatter.me/guides' },
      { '@type': 'ListItem', position: 3, name: 'What is JSON?', item: 'https://jsonformatter.me/guides/what-is-json' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <article className="container mx-auto px-4 py-20 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/" className="hover:text-[var(--accent-primary)]">Home</Link></li>
              <li>/</li>
              <li><Link href="/guides" className="hover:text-[var(--accent-primary)]">Guides</Link></li>
              <li>/</li>
              <li className="text-[var(--text-primary)]">What is JSON?</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              What is JSON?
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              A complete guide to JavaScript Object Notation - the most popular data interchange format on the web.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">JSON Definition</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                <strong className="text-[var(--text-primary)]">JSON (JavaScript Object Notation)</strong> is a lightweight, text-based data format used to store and exchange data. Despite its name, JSON is language-independent and can be used with virtually any programming language.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                JSON was derived from JavaScript but has become the standard data format for web APIs, configuration files, and data storage. It&apos;s human-readable, easy to parse, and supported by every major programming language.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">JSON Example</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Here&apos;s a simple JSON example representing a user:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "isActive": true,
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "gaming"]
}`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">JSON Data Types</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                JSON supports six data types:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">String</h3>
                  <code className="text-sm text-[var(--accent-primary)]">&quot;Hello World&quot;</code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Number</h3>
                  <code className="text-sm text-[var(--accent-primary)]">42, 3.14, -10</code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Boolean</h3>
                  <code className="text-sm text-[var(--accent-primary)]">true, false</code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Null</h3>
                  <code className="text-sm text-[var(--accent-primary)]">null</code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Array</h3>
                  <code className="text-sm text-[var(--accent-primary)]">[1, 2, 3]</code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Object</h3>
                  <code className="text-sm text-[var(--accent-primary)]">{`{"key": "value"}`}</code>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Why Use JSON?</h2>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-[var(--text-primary)]">Human-readable:</strong> Easy to read and write compared to XML or binary formats</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-[var(--text-primary)]">Lightweight:</strong> Minimal syntax means smaller file sizes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-[var(--text-primary)]">Universal support:</strong> Works with JavaScript, Python, Java, PHP, and every major language</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-[var(--text-primary)]">Native to JavaScript:</strong> Parse and stringify with built-in methods</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-[var(--text-primary)]">API standard:</strong> The default format for REST APIs and web services</span>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Common Uses of JSON</h2>
              <div className="space-y-4 text-[var(--text-secondary)]">
                <p><strong className="text-[var(--text-primary)]">Web APIs:</strong> Nearly all modern REST APIs use JSON to send and receive data between servers and clients.</p>
                <p><strong className="text-[var(--text-primary)]">Configuration files:</strong> Many applications use JSON for settings (package.json, tsconfig.json, etc.).</p>
                <p><strong className="text-[var(--text-primary)]">Data storage:</strong> NoSQL databases like MongoDB store data in JSON-like formats.</p>
                <p><strong className="text-[var(--text-primary)]">Data exchange:</strong> Sharing data between different systems and programming languages.</p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">JSON Syntax Rules</h2>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Data is in key/value pairs</li>
                <li>• Keys must be strings in double quotes</li>
                <li>• Values can be strings, numbers, booleans, null, arrays, or objects</li>
                <li>• Data is separated by commas</li>
                <li>• Objects are enclosed in curly braces {`{}`}</li>
                <li>• Arrays are enclosed in square brackets {`[]`}</li>
                <li>• No trailing commas allowed</li>
                <li>• No comments allowed in standard JSON</li>
              </ul>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Try Our JSON Formatter
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Format, validate, and explore your JSON data with our free online tool.
              </p>
              <Link
                href="/"
                className="inline-block bg-[var(--accent-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Open JSON Formatter
              </Link>
            </section>
          </div>

          {/* Related Guides */}
          <nav className="mt-12 pt-8 border-t border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Related Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/guides/json-syntax" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">JSON Syntax Guide</h3>
                <p className="text-sm text-[var(--text-secondary)]">Learn the rules and structure of JSON</p>
              </Link>
              <Link href="/guides/common-json-errors" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">Common JSON Errors</h3>
                <p className="text-sm text-[var(--text-secondary)]">Fix the most frequent JSON mistakes</p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
