import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Common JSON Errors and How to Fix Them',
  description: 'Learn how to fix the most common JSON errors: trailing commas, single quotes, unquoted keys, and more. With examples and solutions.',
  keywords: 'json error, json parse error, json syntax error, fix json, invalid json, json trailing comma, json quotes, json validation error',
  openGraph: {
    title: 'Common JSON Errors and How to Fix Them',
    description: 'Learn how to fix the most common JSON errors with examples and solutions.',
    type: 'article',
    url: 'https://jsonformatter.me/guides/common-json-errors',
  },
  alternates: {
    canonical: 'https://jsonformatter.me/guides/common-json-errors',
  },
};

export default function CommonJsonErrorsPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Common JSON Errors and How to Fix Them',
    description: 'Learn how to fix the most common JSON errors with examples and solutions.',
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
      { '@type': 'ListItem', position: 3, name: 'Common JSON Errors', item: 'https://jsonformatter.me/guides/common-json-errors' },
    ],
  };

  const errors = [
    {
      title: 'Trailing Comma',
      description: 'A comma after the last item in an object or array is not allowed in JSON.',
      wrong: `{
  "name": "John",
  "age": 30,  // Error: trailing comma
}`,
      correct: `{
  "name": "John",
  "age": 30
}`,
      tip: 'Remove the comma after the last property or array element.',
    },
    {
      title: 'Single Quotes Instead of Double Quotes',
      description: 'JSON requires double quotes for strings. Single quotes are not valid.',
      wrong: `{
  'name': 'John'  // Error: single quotes
}`,
      correct: `{
  "name": "John"
}`,
      tip: 'Always use double quotes (") for strings and keys in JSON.',
    },
    {
      title: 'Unquoted Keys',
      description: 'All keys in JSON must be strings enclosed in double quotes.',
      wrong: `{
  name: "John"  // Error: unquoted key
}`,
      correct: `{
  "name": "John"
}`,
      tip: 'Wrap all object keys in double quotes.',
    },
    {
      title: 'Missing Comma Between Items',
      description: 'Each item in an object or array must be separated by a comma.',
      wrong: `{
  "name": "John"
  "age": 30  // Error: missing comma
}`,
      correct: `{
  "name": "John",
  "age": 30
}`,
      tip: 'Add commas between all items except after the last one.',
    },
    {
      title: 'Comments in JSON',
      description: 'Standard JSON does not support comments. They will cause parse errors.',
      wrong: `{
  "name": "John",
  // This is a comment - NOT ALLOWED
  "age": 30
}`,
      correct: `{
  "name": "John",
  "age": 30
}`,
      tip: 'Remove all comments from JSON. Use a separate documentation file if needed.',
    },
    {
      title: 'Undefined or NaN Values',
      description: 'JSON only supports null, not undefined or NaN.',
      wrong: `{
  "value": undefined,  // Error
  "number": NaN        // Error
}`,
      correct: `{
  "value": null,
  "number": 0
}`,
      tip: 'Use null instead of undefined. Replace NaN with a valid number or null.',
    },
    {
      title: 'Unclosed Brackets or Braces',
      description: 'Every opening bracket must have a matching closing bracket.',
      wrong: `{
  "items": [1, 2, 3
}`,
      correct: `{
  "items": [1, 2, 3]
}`,
      tip: 'Check that all { } and [ ] brackets are properly matched and closed.',
    },
    {
      title: 'Invalid Escape Sequences',
      description: 'Backslashes must be properly escaped in strings.',
      wrong: `{
  "path": "C:\\Users\\name"  // May cause issues
}`,
      correct: `{
  "path": "C:\\\\Users\\\\name"
}`,
      tip: 'Use double backslashes (\\\\) or forward slashes (/) in paths.',
    },
  ];

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
              <li className="text-[var(--text-primary)]">Common JSON Errors</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Common JSON Errors and How to Fix Them
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              Troubleshoot and fix the most frequent JSON parsing errors with clear examples and solutions.
            </p>
          </header>

          {/* Quick Tip */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-12">
            <p className="text-[var(--text-primary)]">
              <strong>Quick fix:</strong> Paste your JSON into our <Link href="/" className="text-[var(--accent-primary)] underline">JSON Formatter</Link> - it automatically fixes many common errors like trailing commas and single quotes.
            </p>
          </div>

          {/* Errors List */}
          <div className="space-y-12">
            {errors.map((error, index) => (
              <section key={index} className="border-b border-[var(--border-color)] pb-12 last:border-0">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                  {index + 1}. {error.title}
                </h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  {error.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-red-500 mb-2">Wrong</div>
                    <pre className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-[var(--text-primary)]">{error.wrong}</code>
                    </pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-500 mb-2">Correct</div>
                    <pre className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-[var(--text-primary)]">{error.correct}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Fix:</strong> {error.tip}
                  </p>
                </div>
              </section>
            ))}
          </div>

          {/* Summary */}
          <section className="mt-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Quick Reference</h2>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li>• Always use double quotes for strings and keys</li>
              <li>• No trailing commas after the last item</li>
              <li>• No comments in JSON</li>
              <li>• Match all brackets and braces</li>
              <li>• Use null instead of undefined</li>
              <li>• Escape special characters properly</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="mt-12 bg-[var(--accent-primary)] rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Validate Your JSON Now
            </h2>
            <p className="text-white/80 mb-6">
              Our JSON formatter automatically detects and fixes common errors.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-[var(--accent-primary)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Open JSON Formatter
            </Link>
          </section>

          {/* Related Guides */}
          <nav className="mt-12 pt-8 border-t border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Related Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/guides/what-is-json" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">What is JSON?</h3>
                <p className="text-sm text-[var(--text-secondary)]">Complete introduction to JSON</p>
              </Link>
              <Link href="/guides/json-syntax" className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors">
                <h3 className="font-semibold text-[var(--text-primary)]">JSON Syntax Guide</h3>
                <p className="text-sm text-[var(--text-secondary)]">Learn the rules and structure</p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
