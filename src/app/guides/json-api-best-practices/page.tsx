import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JSON API Best Practices: Structure, Naming & Error Handling',
  description:
    'Learn the best practices for designing clean, consistent JSON REST APIs — key naming, predictable response shapes, structured errors, dates, pagination, and versioning.',
  keywords:
    'json api best practices, rest api json, json api design, api naming conventions, json error response, json api structure',
  openGraph: {
    title: 'JSON API Best Practices: Structure, Naming & Error Handling',
    description:
      'Best practices for designing clean, consistent JSON REST APIs — naming, response structure, errors, dates, pagination, and versioning.',
    type: 'article',
    url: 'https://www.jsonformatter.me/guides/json-api-best-practices',
  },
  alternates: {
    canonical: 'https://www.jsonformatter.me/guides/json-api-best-practices',
  },
};

export default function JsonApiBestPracticesPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'JSON API Best Practices: Structure, Naming & Error Handling',
    description:
      'Best practices for designing clean, consistent JSON REST APIs — naming, response structure, errors, dates, pagination, and versioning.',
    author: {
      '@type': 'Person',
      name: 'Andres Duque',
    },
    publisher: {
      '@type': 'Organization',
      name: 'jsonformatter.me',
      url: 'https://www.jsonformatter.me',
    },
    datePublished: '2026-06-28',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: 'https://www.jsonformatter.me/guides/json-api-best-practices',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jsonformatter.me/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://www.jsonformatter.me/guides',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'JSON API Best Practices',
        item: 'https://www.jsonformatter.me/guides/json-api-best-practices',
      },
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

      <div className="bg-[var(--bg-primary)]">
        <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)]">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/guides" className="hover:text-[var(--accent-primary)]">
                  Guides
                </Link>
              </li>
              <li>/</li>
              <li className="text-[var(--text-primary)]">JSON API Best Practices</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              JSON API Best Practices
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              How to design clean, consistent JSON REST APIs — naming, response structure, error
              handling, dates, pagination, and versioning, with practical examples.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Why consistency matters
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                A JSON API is a contract between your server and every client that consumes it. When
                responses are predictable — same key style, same shape, same error format — clients
                can be written once and trusted everywhere. When they are inconsistent, every
                endpoint becomes a special case that developers have to read, guess at, and work
                around.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                The practices below are not about being clever. They are about being boring in the
                best possible way: a well-designed API is one where, after you have used a few
                endpoints, you can correctly guess how the rest behave. That predictability is the
                single biggest gift you can give the people building against your API.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Use consistent key naming
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Pick one casing convention and use it for every key in every response.{' '}
                <code className="text-[var(--accent-primary)]">camelCase</code> is common in
                JavaScript-heavy stacks, while{' '}
                <code className="text-[var(--accent-primary)]">snake_case</code> is the norm in many
                Python, Ruby, and Go ecosystems. Either is fine — what matters is that you never mix
                them.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "isAdmin": true
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Avoid responses where one object uses{' '}
                <code className="text-[var(--accent-primary)]">first_name</code> and another uses{' '}
                <code className="text-[var(--accent-primary)]">firstName</code>. Inconsistent keys
                force clients to handle both, which is exactly the kind of friction a good API
                removes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Keep response structure predictable
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                A given resource should always serialize to the same shape. Don&apos;t drop fields
                depending on context or change a field&apos;s type between requests. Many APIs wrap
                payloads in a small envelope so there is a stable place for the resource and for
                metadata:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "data": {
    "id": 42,
    "title": "Hello World"
  },
  "meta": {
    "requestId": "a1b2c3"
  }
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Return collections as JSON arrays, not as objects keyed by id. An array preserves
                order, is trivial to iterate, and keeps the shape consistent whether it holds zero,
                one, or a thousand items:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "data": [
    { "id": 1, "title": "First" },
    { "id": 2, "title": "Second" }
  ]
}`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Return meaningful status codes and structured errors
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Use HTTP status codes for what they were designed for:{' '}
                <code className="text-[var(--accent-primary)]">200</code> for success,{' '}
                <code className="text-[var(--accent-primary)]">201</code> for a created resource,{' '}
                <code className="text-[var(--accent-primary)]">400</code> for bad input,{' '}
                <code className="text-[var(--accent-primary)]">401</code> and{' '}
                <code className="text-[var(--accent-primary)]">403</code> for auth problems,{' '}
                <code className="text-[var(--accent-primary)]">404</code> for missing resources, and{' '}
                <code className="text-[var(--accent-primary)]">500</code> for server faults. Never
                return <code className="text-[var(--accent-primary)]">200</code> with an error
                hidden in the body.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                Pair the right status code with a consistent, machine-readable error object. A
                stable <code className="text-[var(--accent-primary)]">code</code> lets clients
                branch on the failure, while{' '}
                <code className="text-[var(--accent-primary)]">message</code> helps a developer
                debug it:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`HTTP/1.1 422 Unprocessable Entity

{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The email field is required.",
    "field": "email"
  }
}`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Use ISO 8601 for dates
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Always serialize timestamps as ISO 8601 strings in UTC. They sort correctly as plain
                text, parse natively in nearly every language, and leave no ambiguity about time
                zones. Avoid Unix epoch integers and locale-specific formats like{' '}
                <code className="text-[var(--accent-primary)]">06/28/2026</code>.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "createdAt": "2026-06-28T10:00:00Z",
  "updatedAt": "2026-06-28T14:30:15Z"
}`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Paginate large collections
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Never return an unbounded list. Offer pagination through query parameters such as{' '}
                <code className="text-[var(--accent-primary)]">?page=2&amp;limit=20</code> or a
                cursor, and include the totals clients need in{' '}
                <code className="text-[var(--accent-primary)]">meta</code> so they can build paging
                controls without guessing:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`{
  "data": [
    { "id": 21, "title": "Item 21" },
    { "id": 22, "title": "Item 22" }
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "totalItems": 137,
    "totalPages": 7
  }
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                For very large or frequently changing datasets, cursor-based pagination (returning a{' '}
                <code className="text-[var(--accent-primary)]">nextCursor</code> token) avoids the
                drift and performance problems that offset paging can cause.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Version your API
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                APIs change. Versioning lets you ship breaking changes without breaking existing
                clients. The most common approach is to put the version in the URL path, which is
                explicit and easy to route:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`GET https://api.example.com/v1/users
GET https://api.example.com/v2/users`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Treat a published version as immutable: add fields freely, but introduce a new
                version before you remove or rename anything clients already depend on.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Other tips</h2>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">Avoid leaking nulls.</strong> Omit
                  fields that have no value rather than padding every object with{' '}
                  <code className="text-[var(--accent-primary)]">null</code>, unless a
                  present-but-null field carries real meaning to clients.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">
                    Be consistent with booleans.
                  </strong>{' '}
                  Use real JSON <code className="text-[var(--accent-primary)]">true</code>/
                  <code className="text-[var(--accent-primary)]">false</code> values, not{' '}
                  <code className="text-[var(--accent-primary)]">&quot;true&quot;</code> strings or{' '}
                  <code className="text-[var(--accent-primary)]">0</code>/
                  <code className="text-[var(--accent-primary)]">1</code> integers.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">
                    Don&apos;t expose internal fields.
                  </strong>{' '}
                  Keep password hashes, internal flags, and database internals out of responses.
                  Serialize an explicit view of each resource rather than dumping the raw record.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Document the schema.</strong>{' '}
                  Publish an OpenAPI specification or clear reference so consumers know every field,
                  type, and error code without reverse-engineering your responses.
                </li>
              </ul>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Validate your API responses
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Paste a sample response into our free formatter to validate it, inspect its
                structure, and confirm your JSON is clean and consistent before you ship it.
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
              <Link
                href="/guides/json-syntax"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">JSON Syntax Guide</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  The rules valid JSON must follow
                </p>
              </Link>
              <Link
                href="/guides/json-in-javascript"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Working with JSON in JavaScript
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Parse, stringify, and handle JSON in JS
                </p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
