import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JSON Syntax Guide - Rules, Structure & Examples',
  description: 'Master JSON syntax with this complete guide. Learn about objects, arrays, data types, nesting, and proper formatting with clear examples.',
  keywords: 'json syntax, json structure, json rules, json format, json object, json array, json data types, json examples',
  openGraph: {
    title: 'JSON Syntax Guide - Rules, Structure & Examples',
    description: 'Master JSON syntax with this complete guide. Objects, arrays, data types, and examples.',
    type: 'article',
    url: 'https://jsonformatter.me/guides/json-syntax',
  },
  alternates: {
    canonical: 'https://jsonformatter.me/guides/json-syntax',
  },
};

export default function JsonSyntaxPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'JSON Syntax Guide - Rules, Structure & Examples',
    description: 'Master JSON syntax with this complete guide.',
    author: { '@type': 'Person', name: 'Andres Duque' },
    publisher: { '@type': 'Organization', name: 'jsonformatter.me', url: 'https://jsonformatter.me' },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jsonformatter.me/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://jsonformatter.me/guides' },
      { '@type': 'ListItem', position: 3, name: 'JSON Syntax', item: 'https://jsonformatter.me/guides/json-syntax' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <article className="container mx-auto px-4 py-20 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/" className="hover:text-[var(--accent-primary)]">Home</Link></li>
              <li>/</li>
              <li><Link href="/guides" className="hover:text-[var(--accent-primary)]">Guides</Link></li>
              <li>/</li>
              <li className="text-[var(--text-primary)]">JSON Syntax</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              JSON Syntax Guide
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              Everything you need to know about JSON structure, rules, and formatting.
            </p>
          </header>

          {/* Content */}
          <div className="space-y-12">
            {/* Basic Structure */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Basic Structure</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                JSON is built on two structures: objects and arrays. Every JSON document must be either an object or an array at the root level.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Object</h3>
                  <pre className="text-sm text-[var(--text-secondary)]">{`{
  "key": "value"
}`}</pre>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Array</h3>
                  <pre className="text-sm text-[var(--text-secondary)]">{`[
  "item1",
  "item2"
]`}</pre>
                </div>
              </div>
            </section>

            {/* Objects */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Objects</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Objects are collections of key-value pairs enclosed in curly braces <code className="bg-[var(--bg-secondary)] px-1 rounded">{`{ }`}</code>.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto mb-4">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "firstName": "John",
  "lastName": "Doe",
  "age": 30,
  "isEmployed": true,
  "address": {
    "street": "123 Main St",
    "city": "New York"
  }
}`}</code>
              </pre>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Keys must be strings in double quotes</li>
                <li>• Key-value pairs are separated by colons</li>
                <li>• Multiple pairs are separated by commas</li>
                <li>• Objects can be nested inside other objects</li>
              </ul>
            </section>

            {/* Arrays */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Arrays</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Arrays are ordered lists of values enclosed in square brackets <code className="bg-[var(--bg-secondary)] px-1 rounded">{`[ ]`}</code>.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto mb-4">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "colors": ["red", "green", "blue"],
  "numbers": [1, 2, 3, 4, 5],
  "mixed": [1, "two", true, null],
  "nested": [[1, 2], [3, 4]],
  "objects": [
    {"name": "Alice"},
    {"name": "Bob"}
  ]
}`}</code>
              </pre>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Values are separated by commas</li>
                <li>• Arrays can contain any data type</li>
                <li>• Arrays can be nested</li>
                <li>• Arrays maintain order</li>
              </ul>
            </section>

            {/* Data Types */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Data Types</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                JSON supports six data types:
              </p>
              <div className="space-y-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">String</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Text enclosed in double quotes.</p>
                  <code className="text-[var(--accent-primary)]">&quot;Hello, World!&quot;</code>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Number</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Integer or floating-point. No quotes.</p>
                  <code className="text-[var(--accent-primary)]">42, 3.14, -17, 1.5e10</code>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Boolean</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">True or false. Lowercase, no quotes.</p>
                  <code className="text-[var(--accent-primary)]">true, false</code>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Null</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Represents empty or no value. Lowercase, no quotes.</p>
                  <code className="text-[var(--accent-primary)]">null</code>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Object</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Collection of key-value pairs in curly braces.</p>
                  <code className="text-[var(--accent-primary)]">{`{"key": "value"}`}</code>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Array</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Ordered list of values in square brackets.</p>
                  <code className="text-[var(--accent-primary)]">[1, 2, 3]</code>
                </div>
              </div>
            </section>

            {/* String Escaping */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">String Escape Characters</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Special characters in strings must be escaped with a backslash:
              </p>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                      <th className="text-left p-3 text-[var(--text-primary)]">Character</th>
                      <th className="text-left p-3 text-[var(--text-primary)]">Escape</th>
                      <th className="text-left p-3 text-[var(--text-primary)]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-secondary)]">
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">&quot;</td>
                      <td className="p-3 font-mono">\&quot;</td>
                      <td className="p-3">Double quote</td>
                    </tr>
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">\</td>
                      <td className="p-3 font-mono">\\</td>
                      <td className="p-3">Backslash</td>
                    </tr>
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">/</td>
                      <td className="p-3 font-mono">\/</td>
                      <td className="p-3">Forward slash</td>
                    </tr>
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">Newline</td>
                      <td className="p-3 font-mono">\n</td>
                      <td className="p-3">Line break</td>
                    </tr>
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">Tab</td>
                      <td className="p-3 font-mono">\t</td>
                      <td className="p-3">Tab character</td>
                    </tr>
                    <tr className="border-t border-[var(--border-color)]">
                      <td className="p-3">Unicode</td>
                      <td className="p-3 font-mono">\uXXXX</td>
                      <td className="p-3">Unicode character</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rules Summary */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Syntax Rules Summary</h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
                <ul className="space-y-3 text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Use double quotes for all strings and keys
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Separate items with commas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Use colon between key and value
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    No trailing commas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    No comments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    No single quotes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    No undefined (use null)
                  </li>
                </ul>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Practice with Our JSON Formatter
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Validate and format your JSON to ensure correct syntax.
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
              <Link href="/guides/what-is-json" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">What is JSON?</h3>
                <p className="text-sm text-[var(--text-secondary)]">Complete introduction to JSON</p>
              </Link>
              <Link href="/guides/common-json-errors" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">Common JSON Errors</h3>
                <p className="text-sm text-[var(--text-secondary)]">Fix the most frequent mistakes</p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
